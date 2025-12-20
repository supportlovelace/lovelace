import { Hono } from "hono";
import { db } from "../../db";
import { publishers, studios, users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { v1 } from "@authzed/authzed-node";
import { checkPermission, spicedbClient } from "../../authz/client";
import { makeAuthMetadata, deleteResourceRelationships } from "./utils";
import type { PublisherInsert } from "../../types";

const app = new Hono();

// LIST
app.get("/", async (c) => {
  try {
    const allPublishers = await db.select().from(publishers);
    return c.json({ publishers: allPublishers });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des publishers" }, 500);
  }
});

// CREATE
app.post("/", async (c) => {
  const userId = c.get("userId"); // Injecté par le middleware global dans index.ts
  const { name, description } = await c.req.json();

  if (!name) return c.json({ error: "Le nom est requis" }, 400);

  try {
    const [newPublisher] = await db
      .insert(publishers)
      .values({
        name,
        description: description || null,
        createdBy: userId,
      })
      .returning();

    // Lier automatiquement au système Lovelace pour l'héritage Super-Admin
    const md = makeAuthMetadata();
    const update = v1.RelationshipUpdate.create({
      operation: v1.RelationshipUpdate_Operation.CREATE,
      relationship: v1.Relationship.create({
        resource: v1.ObjectReference.create({ objectType: "publisher", objectId: newPublisher.id }),
        relation: "parent_system",
        subject: v1.SubjectReference.create({
          object: v1.ObjectReference.create({ objectType: "lovelace_system", objectId: "lovelace" })
        }),
      }),
    });

    await spicedbClient.promises.writeRelationships(v1.WriteRelationshipsRequest.create({ updates: [update] }), md);

    return c.json({ message: "Publisher créé", publisher: newPublisher }, 201);

  } catch (error) {
    return c.json({ error: "Erreur lors de la création du publisher" }, 500);
  }
});

// READ
app.get("/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const [publisher] = await db.select().from(publishers).where(eq(publishers.id, id));
    if (!publisher) return c.json({ error: "Publisher non trouvé" }, 404);
    return c.json({ publisher });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération du publisher" }, 500);
  }
});

// UPDATE
app.put("/:id", async (c) => {
  const { id } = c.req.param();
  const { name, description } = await c.req.json();
  
  try {
    const [updated] = await db
      .update(publishers)
      .set({ 
        name, 
        description: description || null,
        updatedAt: new Date() 
      })
      .where(eq(publishers.id, id))
      .returning();
      
    if (!updated) return c.json({ error: "Publisher non trouvé" }, 404);
    return c.json({ publisher: updated });
  } catch (error) {
    return c.json({ error: "Erreur lors de la mise à jour" }, 500);
  }
});

// DELETE
app.delete("/:id", async (c) => {
  const { id } = c.req.param();
  
  try {
    // 1. Supprimer dans Postgres
    const [deleted] = await db
      .delete(publishers)
      .where(eq(publishers.id, id))
      .returning();
      
    if (!deleted) return c.json({ error: "Publisher non trouvé" }, 404);
    
    // 2. Supprimer les relations dans SpiceDB
    await deleteResourceRelationships("publisher", id);
    
    return c.json({ message: "Publisher supprimé avec succès", id });
  } catch (error) {
    return c.json({ error: "Erreur lors de la suppression" }, 500);
  }
});

// LIST STUDIOS
app.get("/:id/studios", async (c) => {
  const { id } = c.req.param();
  try {
    const publisherStudios = await db.select().from(studios).where(eq(studios.publisherId, id));
    return c.json({ studios: publisherStudios });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des studios" }, 500);
  }
});

// LIST USERS (Permissions)
app.get("/:id/users", async (c) => {
  const { id } = c.req.param();
  
  try {
    const [publisher] = await db.select().from(publishers).where(eq(publishers.id, id));
    if (!publisher) return c.json({ error: "Publisher non trouvé" }, 404);

    const md = makeAuthMetadata();
    const allUsers = await db.select().from(users);

    const userRelations = await Promise.all(
      allUsers.map(async (user) => {
        const adminReq = v1.CheckPermissionRequest.create({
          resource: v1.ObjectReference.create({ objectType: "publisher", objectId: id }),
          permission: "admin",
          subject: v1.SubjectReference.create({ object: v1.ObjectReference.create({ objectType: "user", objectId: user.id }) }),
        });
        
        const memberReq = v1.CheckPermissionRequest.create({
          resource: v1.ObjectReference.create({ objectType: "publisher", objectId: id }),
          permission: "member",
          subject: v1.SubjectReference.create({ object: v1.ObjectReference.create({ objectType: "user", objectId: user.id }) }),
        });

        const [adminRes, memberRes] = await Promise.all([
          spicedbClient.promises.checkPermission(adminReq, md),
          spicedbClient.promises.checkPermission(memberReq, md)
        ]);

        const isAdmin = adminRes.permissionship === v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION;
        const isMember = memberRes.permissionship === v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION;

        return {
          userId: user.id,
          role: isAdmin ? "admin" : isMember ? "member" : "none",
          user: user,
        };
      })
    );

    return c.json({
      publisher,
      userRelations: userRelations.filter((ur) => ur.role !== "none"),
    });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des utilisateurs" }, 500);
  }
});

// MANAGE USERS
app.post("/:id/users", async (c) => {
  const { id } = c.req.param();
  const { userId: targetUserId, role, action } = await c.req.json();

  if (!targetUserId || !role || !action) return c.json({ error: "Paramètres manquants" }, 400);

  try {
    const md = makeAuthMetadata();
    const update = v1.RelationshipUpdate.create({
      operation: action === "add" ? v1.RelationshipUpdate_Operation.CREATE : v1.RelationshipUpdate_Operation.DELETE,
      relationship: v1.Relationship.create({
        resource: v1.ObjectReference.create({ objectType: "publisher", objectId: id }),
        relation: role,
        subject: v1.SubjectReference.create({ object: v1.ObjectReference.create({ objectType: "user", objectId: targetUserId }) }),
      }),
    });

    const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
    await spicedbClient.promises.writeRelationships(req, md);

    return c.json({ message: "Permissions mises à jour", role, action });
  } catch (error) {
    return c.json({ error: "Erreur SpiceDB" }, 500);
  }
});

export default app;
