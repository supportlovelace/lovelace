import { Hono } from "hono";
import { db } from "../../db";
import { studios, games, publishers, users, platforms, gamePlatforms } from "../../db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { v1 } from "@authzed/authzed-node";
import { spicedbClient } from "../../authz/client";
import { makeAuthMetadata, deleteResourceRelationships } from "./utils";

const app = new Hono();

// LIST ALL
app.get("/", async (c) => {
  try {
    const allGames = await db
      .select({
        id: games.id,
        name: games.name,
        description: games.description,
        logoAssetId: games.logoAssetId,
        studioId: games.studioId,
        studioName: studios.name,
        publisherId: studios.publisherId,
        publisherName: publishers.name,
        createdAt: games.createdAt,
      })
      .from(games)
      .leftJoin(studios, eq(games.studioId, studios.id))
      .leftJoin(publishers, eq(studios.publisherId, publishers.id));
    
    return c.json({ games: allGames });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des jeux" }, 500);
  }
});

// CREATE
app.post("/", async (c) => {
  const userId = c.get("userId");
  const { name, description, studioId, logoAssetId } = await c.req.json();

  if (!name || !studioId) return c.json({ error: "Nom et studioId requis" }, 400);

  try {
    const [studio] = await db.select().from(studios).where(eq(studios.id, studioId));
    if (!studio) return c.json({ error: "Studio non trouvé" }, 404);

    const [newGame] = await db
      .insert(games)
      .values({
        name,
        description: description || null,
        studioId,
        logoAssetId: logoAssetId || null,
        createdBy: userId,
      })
      .returning();

    const md = makeAuthMetadata();
    const update = v1.RelationshipUpdate.create({
      operation: v1.RelationshipUpdate_Operation.CREATE,
      relationship: v1.Relationship.create({
        resource: v1.ObjectReference.create({ objectType: "game", objectId: newGame.id }),
        relation: "studio",
        subject: v1.SubjectReference.create({ object: v1.ObjectReference.create({ objectType: "studio", objectId: studioId }) }),
      }),
    });

    await spicedbClient.promises.writeRelationships(v1.WriteRelationshipsRequest.create({ updates: [update] }), md);

    return c.json({ message: "Jeu créé", game: newGame }, 201);
  } catch (error) {
    return c.json({ error: "Erreur lors de la création du jeu" }, 500);
  }
});

// READ
app.get("/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const [game] = await db
      .select({
        id: games.id,
        name: games.name,
        description: games.description,
        logoAssetId: games.logoAssetId,
        studioId: games.studioId,
        studioName: studios.name,
        createdBy: games.createdBy,
        createdAt: games.createdAt,
      })
      .from(games)
      .leftJoin(studios, eq(games.studioId, studios.id))
      .where(eq(games.id, id));
    
    if (!game) return c.json({ error: "Jeu non trouvé" }, 404);
    return c.json({ game });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération du jeu" }, 500);
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
          resourceType: "game",
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
    console.error("SpiceDB Error:", error);
    return c.json({ error: "Erreur SpiceDB", details: error.message }, 500);
  }
});

// UPDATE
app.put("/:id", async (c) => {
  const { id } = c.req.param();
  const { name, description, logoAssetId } = await c.req.json();
  
  try {
    const [updated] = await db
      .update(games)
      .set({ 
        name, 
        description: description || null, 
        logoAssetId: logoAssetId || null,
        updatedAt: new Date() 
      })
      .where(eq(games.id, id))
      .returning();
      
    if (!updated) return c.json({ error: "Jeu non trouvé" }, 404);
    return c.json({ game: updated });
  } catch (error) {
    return c.json({ error: "Erreur lors de la mise à jour" }, 500);
  }
});

// DELETE
app.delete("/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const [deleted] = await db.delete(games).where(eq(games.id, id)).returning();
    if (!deleted) return c.json({ error: "Jeu non trouvé" }, 404);
    
    await deleteResourceRelationships("game", id);
    return c.json({ message: "Jeu supprimé", id });
  } catch (error) {
    return c.json({ error: "Erreur lors de la suppression" }, 500);
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
        resource: v1.ObjectReference.create({ objectType: "game", objectId: id }),
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

// LIST PLATFORMS FOR A GAME
app.get("/:id/platforms", async (c) => {
  const { id } = c.req.param();
  try {
    const integrations = await db
      .select({
        id: gamePlatforms.id,
        platformId: gamePlatforms.platformId,
        platformName: platforms.name,
        platformSlug: platforms.slug,
        platformLogoAssetId: platforms.logoAssetId,
        config: gamePlatforms.config,
        status: gamePlatforms.status,
        createdAt: gamePlatforms.createdAt,
      })
      .from(gamePlatforms)
      .innerJoin(platforms, eq(gamePlatforms.platformId, platforms.id))
      .where(eq(gamePlatforms.gameId, id));
    
    return c.json({ integrations });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des intégrations" }, 500);
  }
});

// ADD/UPDATE PLATFORM FOR A GAME
app.post("/:id/platforms", async (c) => {
  const { id } = c.req.param();
  const userId = c.get("userId");
  const { platformId, config, status } = await c.req.json();

  if (!platformId) return c.json({ error: "platformId requis" }, 400);

  try {
    const [existing] = await db
      .select()
      .from(gamePlatforms)
      .where(and(eq(gamePlatforms.gameId, id), eq(gamePlatforms.platformId, platformId)));

    if (existing) {
      const [updated] = await db
        .update(gamePlatforms)
        .set({
          config: config || existing.config,
          status: status || existing.status,
          updatedAt: new Date(),
        })
        .where(eq(gamePlatforms.id, existing.id))
        .returning();
      return c.json({ message: "Intégration mise à jour", integration: updated });
    } else {
      const [newIntegration] = await db
        .insert(gamePlatforms)
        .values({
          gameId: id,
          platformId,
          config: config || {},
          status: status || "pending",
          createdBy: userId,
        })
        .returning();
      return c.json({ message: "Plateforme ajoutée au jeu", integration: newIntegration }, 201);
    }
  } catch (error) {
    return c.json({ error: "Erreur lors de la gestion de l'intégration" }, 500);
  }
});

// REMOVE PLATFORM FROM A GAME
app.delete("/:id/platforms/:integrationId", async (c) => {
  const { integrationId } = c.req.param();
  try {
    const [deleted] = await db
      .delete(gamePlatforms)
      .where(eq(gamePlatforms.id, integrationId))
      .returning();
    
    if (!deleted) return c.json({ error: "Intégration non trouvée" }, 404);
    return c.json({ message: "Intégration supprimée" });
  } catch (error) {
    return c.json({ error: "Erreur lors de la suppression" }, 500);
  }
});

export default app;