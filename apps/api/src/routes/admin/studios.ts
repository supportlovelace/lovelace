import { Hono } from "hono";
import { db } from "../../db";
import { publishers, studios, games, users } from "../../db/schema";
import { eq, inArray } from "drizzle-orm";
import { v1 } from "@authzed/authzed-node";
import { spicedbClient } from "../../authz/client";
import { makeAuthMetadata, deleteResourceRelationships } from "./utils";
import type { StudioInsert } from "../../types";

const app = new Hono();

// LIST
app.get("/", async (c) => {
  try {
    const allStudios = await db
      .select({
        id: studios.id,
        name: studios.name,
        description: studios.description,
        publisherId: studios.publisherId,
        publisherName: publishers.name,
        createdBy: studios.createdBy,
        createdAt: studios.createdAt,
        updatedAt: studios.updatedAt,
      })
      .from(studios)
      .leftJoin(publishers, eq(studios.publisherId, publishers.id));
    return c.json({ studios: allStudios });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des studios" }, 500);
  }
});

// CREATE
app.post("/", async (c) => {
  const userId = c.get("userId");
  const { name, description, publisherId } = await c.req.json();

  if (!name || !publisherId) return c.json({ error: "Nom et publisherId requis" }, 400);

  try {
    const [publisher] = await db.select().from(publishers).where(eq(publishers.id, publisherId));
    if (!publisher) return c.json({ error: "Publisher non trouvé" }, 404);

    const [newStudio] = await db
      .insert(studios)
      .values({
        name,
        description: description || null,
        publisherId,
        createdBy: userId,
      } as StudioInsert)
      .returning();

    const md = makeAuthMetadata();
    const update = v1.RelationshipUpdate.create({
      operation: v1.RelationshipUpdate_Operation.CREATE,
      relationship: v1.Relationship.create({
        resource: v1.ObjectReference.create({ objectType: "studio", objectId: newStudio.id }),
        relation: "publisher",
        subject: v1.SubjectReference.create({ object: v1.ObjectReference.create({ objectType: "publisher", objectId: publisherId }) }),
      }),
    });

    await spicedbClient.promises.writeRelationships(v1.WriteRelationshipsRequest.create({ updates: [update] }), md);

    return c.json({ message: "Studio créé", studios: [newStudio] }, 201);
  } catch (error) {
    return c.json({ error: "Erreur lors de la création du studio" }, 500);
  }
});

// READ
app.get("/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const [studio] = await db
      .select({
        id: studios.id,
        name: studios.name,
        description: studios.description,
        publisherId: studios.publisherId,
        publisherName: publishers.name,
        createdBy: studios.createdBy,
        createdAt: studios.createdAt,
      })
      .from(studios)
      .leftJoin(publishers, eq(studios.publisherId, publishers.id))
      .where(eq(studios.id, id));
    
    if (!studio) return c.json({ error: "Studio non trouvé" }, 404);
    return c.json({ studio });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération du studio" }, 500);
  }
});

// LIST USERS WITH ACCESS
app.get("/:id/users", async (c) => {
  const { id } = c.req.param();
  try {
    const md = makeAuthMetadata();
    const stream = spicedbClient.readRelationships(
      v1.ReadRelationshipsRequest.create({
        relationshipFilter: v1.RelationshipFilter.create({
          resourceType: "studio",
          optionalResourceId: id,
        }),
      }),
      md
    );

    const userRelations: { userId: string, role: string }[] = [];
    
    await new Promise((resolve, reject) => {
      stream.on("data", (response: v1.ReadRelationshipsResponse) => {
        if (response.relationship?.subject?.object?.objectType === "user") {
          userRelations.push({
            userId: response.relationship.subject.object.objectId,
            role: response.relationship.relation,
          });
        }
      });
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(true));
    });

    if (userRelations.length === 0) {
      return c.json({ userRelations: [] });
    }

    const userIds = userRelations.map((r) => r.userId);
    const dbUsers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.id, userIds));

    const enrichedRelations = userRelations.map(rel => ({
      ...rel,
      user: dbUsers.find(u => u.id === rel.userId)
    }));

    return c.json({ userRelations: enrichedRelations });
  } catch (error: any) {
    return c.json({ error: "Erreur SpiceDB", details: error.message }, 500);
  }
});

// UPDATE
app.put("/:id", async (c) => {
  const { id } = c.req.param();
  const { name, description } = await c.req.json();
  
  try {
    const [updated] = await db
      .update(studios)
      .set({ name, description: description || null, updatedAt: new Date() })
      .where(eq(studios.id, id))
      .returning();
      
    if (!updated) return c.json({ error: "Studio non trouvé" }, 404);
    return c.json({ studio: updated });
  } catch (error) {
    return c.json({ error: "Erreur lors de la mise à jour" }, 500);
  }
});

// DELETE
app.delete("/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const [deleted] = await db.delete(studios).where(eq(studios.id, id)).returning();
    if (!deleted) return c.json({ error: "Studio non trouvé" }, 404);
    
    await deleteResourceRelationships("studio", id);
    return c.json({ message: "Studio supprimé", id });
  } catch (error) {
    return c.json({ error: "Erreur lors de la suppression" }, 500);
  }
});

// LIST GAMES
app.get("/:id/games", async (c) => {
  const { id } = c.req.param();
  try {
    const studioGames = await db.select().from(games).where(eq(games.studioId, id));
    return c.json({ games: studioGames });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des jeux" }, 500);
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
        resource: v1.ObjectReference.create({ objectType: "studio", objectId: id }),
        relation: role,
        subject: v1.SubjectReference.create({ object: v1.ObjectReference.create({ objectType: "user", objectId: targetUserId }) }),
      }),
    });

    await spicedbClient.promises.writeRelationships(v1.WriteRelationshipsRequest.create({ updates: [update] }), md);
    return c.json({ message: "Permissions mises à jour", role, action });
  } catch (error) {
    return c.json({ error: "Erreur SpiceDB" }, 500);
  }
});

export default app;
