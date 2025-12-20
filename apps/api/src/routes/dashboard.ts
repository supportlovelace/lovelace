import { Hono } from "hono";
import { db } from "../db";
import { games, studios } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { spicedbClient } from "../authz/client";
import { v1 } from "@authzed/authzed-node";
import { Metadata } from "@grpc/grpc-js";
import type { GameWithStudio } from "../types";

// Type pour le contexte avec userId
type Variables = {
  userId: string;
};

const dashboardRoute = new Hono<{ Variables: Variables }>();

function makeAuthMetadata(): Metadata {
  const md = new Metadata();
  const token =
    process.env.SPICEDB_GRPC_PRESHARED_KEY || process.env.SPICEDB_GRPC_TOKEN;
  if (token) md.set("authorization", `Bearer ${token}`);
  return md;
}

// GET /dashboard/my-games - Lister les jeux accessibles par l'utilisateur courant
dashboardRoute.get("/my-games", async (c) => {
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Utilisateur non authentifié" }, 401);
  }

  try {
    console.log(`🔍 Recherche des jeux pour l'utilisateur: ${userId}`);

    // 1. Drizzle: Récupérer tous les jeux avec jointure studio
    const allGames = await db
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

    console.log(`📋 Total jeux dans BDD: ${allGames.length}`);

    // 2. SpiceDB: Filtrer les jeux par permission view
    const accessibleGames: typeof allGames = [];
    const md = makeAuthMetadata();

    for (const game of allGames) {
      const checkRequest = v1.CheckPermissionRequest.create({
        resource: v1.ObjectReference.create({
          objectType: "game",
          objectId: game.id,
        }),
        permission: "view",
        subject: v1.SubjectReference.create({
          object: v1.ObjectReference.create({
            objectType: "user",
            objectId: userId,
          }),
        }),
      });

      try {
        const checkResponse = await spicedbClient.promises.checkPermission(
          checkRequest,
          md,
        );
        if (
          checkResponse.permissionship ===
          v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION
        ) {
          accessibleGames.push(game);
        }
      } catch (error) {
        console.error(`Erreur vérification jeu ${game.id}:`, error);
      }
    }

    console.log(`🎯 Jeux accessibles via SpiceDB: ${accessibleGames.length}`);

    // Conversion des dates en string pour la compatibilité frontend
    const gamesWithFormattedDates = accessibleGames.map((game) => ({
      ...game,
      createdAt: game.createdAt?.toISOString() || null,
      updatedAt: game.updatedAt?.toISOString() || null,
    }));

    return c.json({ games: gamesWithFormattedDates });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des jeux utilisateur:",
      error,
    );
    return c.json({ error: "Erreur lors de la récupération des jeux" }, 500);
  }
});

export { dashboardRoute };
