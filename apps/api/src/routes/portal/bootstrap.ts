import { Hono } from "hono";
import { v1 } from "@authzed/authzed-node";
import { spicedbClient } from "../../authz/client";
import { makeAuthMetadata } from "../admin/utils";
import { db } from "../../db";
import { users, games, studios, publishers } from "../../db/schema";
import { eq, inArray } from "drizzle-orm";

const app = new Hono();

app.get("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Non authentifié" }, 401);

  try {
    const md = makeAuthMetadata();

    // 1. Vérifier si l'utilisateur est Super Admin Global
    const checkSuperAdminReq = v1.CheckPermissionRequest.create({
      resource: v1.ObjectReference.create({ objectType: "lovelace_system", objectId: "lovelace" }),
      subject: v1.SubjectReference.create({
        object: v1.ObjectReference.create({ objectType: "user", objectId: userId })
      }),
      permission: "global_access",
      consistency: v1.Consistency.create({
        requirement: { oneofKind: "fullyConsistent", fullyConsistent: true }
      })
    });

    const superAdminRes = await spicedbClient.promises.checkPermission(checkSuperAdminReq, md);
    const isSuperAdmin = superAdminRes.permissionship === v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION;

    // 2. Récupérer les jeux
    let gameIds: string[] = [];
    let isGlobalAdmin = false;

    if (isSuperAdmin) {
      console.log(`👑 User ${userId} is Super Admin, bypassing resource lookup.`);
      isGlobalAdmin = true;
    } else {
      // Lookup classique pour les utilisateurs normaux
      const fetchResources = async (type: "publisher" | "studio" | "game", limit?: number) => {
        const stream = spicedbClient.readRelationships( // lookupResources est parfois capricieux avec l'héritage profond
          v1.ReadRelationshipsRequest.create({
            relationshipFilter: v1.RelationshipFilter.create({ resourceType: type }),
          }),
          md
        );
        // ... (on garde l'ancien système pour les users normaux mais avec lookupResources)
      };

      // Utilisation de lookupResources pour les users normaux
      const lookupReq = v1.LookupResourcesRequest.create({
        resourceObjectType: "game",
        permission: "view",
        subject: v1.SubjectReference.create({
          object: v1.ObjectReference.create({ objectType: "user", objectId: userId }),
        }),
        consistency: v1.Consistency.create({
          requirement: { oneofKind: "fullyConsistent", fullyConsistent: true }
        })
      });

      const stream = spicedbClient.lookupResources(lookupReq, md);
      for await (const resp of stream) {
        if (resp.resourceObjectId) gameIds.push(resp.resourceObjectId);
      }
    }

    // 3. Récupérer les détails des jeux
    let myGames: any[] = [];
    
    const query = db
      .select({
        id: games.id,
        name: games.name,
        description: games.description,
        studioId: games.studioId,
        studioName: studios.name,
        publisherId: studios.publisherId,
        publisherName: publishers.name,
        createdAt: games.createdAt,
      })
      .from(games)
      .leftJoin(studios, eq(games.studioId, studios.id))
      .leftJoin(publishers, eq(studios.publisherId, publishers.id));

    if (isGlobalAdmin) {
      myGames = await query;
    } else if (gameIds.length > 0) {
      myGames = await query.where(inArray(games.id, gameIds));
    }

    const [userData] = await db.select().from(users).where(eq(users.id, userId));
    if (!userData) return c.json({ error: "Utilisateur non trouvé" }, 404);

    return c.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        highestRole: isGlobalAdmin ? "SuperAdmin" : (myGames.length > 0 ? "Game" : "User")
      },
      games: myGames,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Portal Bootstrap Error:", error);
    return c.json({ error: "Erreur lors de l'initialisation du portail", details: error.message }, 500);
  }
});

export default app;
