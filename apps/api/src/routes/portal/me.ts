import { Hono } from "hono";
import { v1 } from "@authzed/authzed-node";
import { spicedbClient } from "../../authz/client";
import { makeAuthMetadata } from "../admin/utils";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();

app.get("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Non authentifié" }, 401);

  try {
    const md = makeAuthMetadata();
    
    // 1. Récupérer les infos de base Postgres
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return c.json({ error: "Utilisateur non trouvé" }, 404);

    // 2. Déterminer le rang via SpiceDB (en parallèle pour la perf)
    const checkRank = async (type: "publisher" | "studio" | "game") => {
      const resp = await spicedbClient.promises.lookupResources(
        v1.LookupResourcesRequest.create({
          resourceObjectType: type,
          permission: "view",
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({ objectType: "user", objectId: userId }),
          }),
          limit: 1, // On a juste besoin de savoir s'il y en a UN
        }),
        md
      );
      // lookupResources en mode promise renvoie un itérable, mais on peut vérifier s'il y a des données
      // En gRPC streaming, c'est un peu différent, on va utiliser une version simplifiée
      return resp;
    };

    // Note: lookupResources est un stream. Pour faire simple et rapide, on va utiliser 
    // une approche séquentielle légère ou un Check global si on avait une ressource parente.
    // Ici, on va faire 3 petits LookupResources rapides.

    let highestRole = "User";

    const types = ["publisher", "studio", "game"] as const;
    for (const type of types) {
      const stream = spicedbClient.lookupResources(
        v1.LookupResourcesRequest.create({
          resourceObjectType: type,
          permission: "view",
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({ objectType: "user", objectId: userId }),
          }),
          limit: 1,
        }),
        md
      );

      let found = false;
      for await (const resp of stream) {
        if (resp.resourceObjectId) {
          found = true;
          break;
        }
      }

      if (found) {
        highestRole = type.charAt(0).toUpperCase() + type.slice(1);
        break; // On a trouvé le plus haut, on s'arrête
      }
    }

    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        highestRole
      }
    });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération du profil" }, 500);
  }
});

export default app;
