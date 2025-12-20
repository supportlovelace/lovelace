import { Hono } from "hono";
import { db } from "../../db";
import { games, studios, publishers } from "../../db/schema";
import { eq, inArray } from "drizzle-orm";
import { v1 } from "@authzed/authzed-node";
import { spicedbClient } from "../../authz/client";
import { makeAuthMetadata } from "../admin/utils";

const app = new Hono();

// LIST MY GAMES
app.get("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Utilisateur non authentifié" }, 401);

  try {
    const md = makeAuthMetadata();
    
    // On cherche tous les jeux où l'utilisateur a la permission 'view'
    // LookupResources est parfait pour ça
    const stream = spicedbClient.lookupResources(
      v1.LookupResourcesRequest.create({
        resourceObjectType: "game",
        permission: "view",
        subject: v1.SubjectReference.create({
          object: v1.ObjectReference.create({
            objectType: "user",
            objectId: userId,
          }),
        }),
        consistency: v1.Consistency.create({
          requirement: { oneofKind: "fullyConsistent", fullyConsistent: true }
        })
      }),
      md
    );

    const gameIds: string[] = [];
    await new Promise((resolve, reject) => {
      stream.on("data", (response: v1.LookupResourcesResponse) => {
        if (response.resourceObjectId) {
          gameIds.push(response.resourceObjectId);
        }
      });
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(true));
    });

    if (gameIds.length === 0) {
      return c.json({ games: [] });
    }

    // Récupérer les détails des jeux depuis Postgres
    const myGames = await db
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
      .leftJoin(publishers, eq(studios.publisherId, publishers.id))
      .where(inArray(games.id, gameIds));

    return c.json({ games: myGames });
  } catch (error: any) {
    console.error("Portal Games Error:", error);
    return c.json({ error: "Erreur lors de la récupération de vos jeux", details: error.message }, 500);
  }
});

export default app;
