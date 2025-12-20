import { Hono } from "hono";
import { db } from "../db";
import { games, studios } from "../db/schema";
import {
  checkPermission,
  writeRelationship,
  spicedbClient,
} from "../authz/client";
import { requireGameManage } from "../middleware/requireGameManage";
import { requireGlobalAccess } from "../middleware/requireGlobalAccess";
import { eq } from "drizzle-orm";
import { v1 } from "@authzed/authzed-node";
import { Metadata } from "@grpc/grpc-js";
import type { Game, GameInsert, GamesResponse } from "../types";

type Variables = {
  userId: string;
};

function makeAuthMetadata(): Metadata {
  const md = new Metadata();
  const token =
    process.env.SPICEDB_GRPC_PRESHARED_KEY || process.env.SPICEDB_GRPC_TOKEN;
  if (token) md.set("authorization", `Bearer ${token}`);
  return md;
}

export const gamesRoute = new Hono<{ Variables: Variables }>()
  // GET /games - Lister tous les jeux (protégé par requireGlobalAccess)
  .get("/", requireGlobalAccess, async (c) => {
    try {
      const userId = c.get("userId") || c.req.header("x-user-id");

      if (!userId) {
        return c.json({ error: "Utilisateur non authentifié" }, 401);
      }

      const rows = await db
        .select({
          id: games.id,
          name: games.name,
          description: games.description,
          studioId: games.studioId,
          studioName: studios.name,
          createdBy: games.createdBy,
          createdAt: games.createdAt,
          updatedAt: games.updatedAt,
        })
        .from(games)
        .leftJoin(studios, eq(games.studioId, studios.id));

      // Pour le moment, on retourne tous les jeux (plus tard : filtrage avec LookupResources)
      return c.json({ games: rows });
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  })
  // POST /games - Créer un nouveau jeu (protégé par requireGlobalAccess)
  .post("/", requireGlobalAccess, async (c) => {
    try {
      const { name, description, studioId } = await c.req.json();
      const userId = c.get("userId") || c.req.header("x-user-id");

      if (!userId) {
        return c.json({ error: "Utilisateur non authentifié" }, 401);
      }

      if (!name || !studioId) {
        return c.json({ error: "Le nom et studioId sont requis" }, 400);
      }

      // Vérifier que le studio existe
      const [studio] = await db
        .select()
        .from(studios)
        .where(eq(studios.id, studioId));
      if (!studio) {
        return c.json({ error: "Studio non trouvé" }, 404);
      }

      // Insérer le jeu dans la base de données
      const game = (
        await db
          .insert(games)
          .values({
            name,
            description: description || null,
            studioId,
            createdBy: userId,
          })
          .returning()
      )[0];

      // Écrire la relation SpiceDB pour l'héritage
      // game:[ID] studio studio:[StudioID]
      const md = makeAuthMetadata();
      const update = v1.RelationshipUpdate.create({
        operation: v1.RelationshipUpdate_Operation.CREATE,
        relationship: v1.Relationship.create({
          resource: v1.ObjectReference.create({
            objectType: "game",
            objectId: game.id,
          }),
          relation: "studio",
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({
              objectType: "studio",
              objectId: studioId,
            }),
          }),
        }),
      });

      const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
      await spicedbClient.promises.writeRelationships(req, md);

      return c.json({
        message: "Jeu créé avec succès",
        game,
      });
    } catch (error) {
      return c.json(
        {
          error: (error as Error).message,
        },
        500,
      );
    }
  })
  // PUT /games/:id - Mettre à jour un jeu (protégé par requireGameManage)
  .put("/:id", requireGameManage, async (c) => {
    try {
      const { id } = c.req.param() as { id: string };
      const { name, description } = await c.req.json();
      const userId = c.get("userId") || c.req.header("x-user-id");

      if (!userId) {
        return c.json({ error: "Utilisateur non authentifié" }, 401);
      }

      if (!name) {
        return c.json({ error: "Le nom est requis" }, 400);
      }

      // Vérifier que le jeu existe
      const [existingGame] = await db
        .select()
        .from(games)
        .where(eq(games.id, id));
      if (!existingGame) {
        return c.json({ error: "Jeu non trouvé" }, 404);
      }

      // Mettre à jour le jeu
      const [updatedGame] = await db
        .update(games)
        .set({
          name,
          description: description || null,
          updatedAt: new Date(),
        })
        .where(eq(games.id, id))
        .returning();

      return c.json({
        message: "Jeu mis à jour avec succès",
        game: updatedGame,
      });
    } catch (error) {
      return c.json(
        {
          error: (error as Error).message,
        },
        500,
      );
    }
  });
