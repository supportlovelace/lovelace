import { v1 } from "@authzed/authzed-node";
import { spicedbClient } from "../src/authz/client";
import { db } from "../src/db";
import { publishers, studios, games } from "../src/db/schema";
import { inArray } from "drizzle-orm";
import { Metadata } from "@grpc/grpc-js";
import { deleteResourceRelationships } from "../src/routes/admin/utils";

function makeAuthMetadata(): Metadata {
  const md = new Metadata();
  const token = process.env.SPICEDB_GRPC_TOKEN;
  if (token) md.set("authorization", `Bearer ${token}`);
  return md;
}

/**
 * Janitor Script pour Lovelace
 * Compare SpiceDB avec PostgreSQL et supprime les relations orphelines.
 */
async function janitor() {
  console.log("🧹 Lovelace Janitor: Recherche de relations orphelines dans SpiceDB...");
  const md = makeAuthMetadata();

  const typesToCheck = [
    { type: "publisher", table: publishers },
    { type: "studio", table: studios },
    { type: "game", table: games }
  ];

  try {
    for (const { type, table } of typesToCheck) {
      console.log(`\n🔍 Vérification du type: ${type}`);
      
      // 1. Lister toutes les relations de ce type dans SpiceDB
      const stream = spicedbClient.readRelationships(
        v1.ReadRelationshipsRequest.create({
          relationshipFilter: v1.RelationshipFilter.create({ resourceType: type })
        }),
        md
      );

      const spiceIds = new Set<string>();
      await new Promise((resolve) => {
        stream.on("data", (res) => {
          if (res.relationship?.resource?.objectId) {
            spiceIds.add(res.relationship.resource.objectId);
          }
        });
        stream.on("end", resolve);
      });

      if (spiceIds.size === 0) {
        console.log(`  ✅ Aucune relation trouvée pour ${type}.`);
        continue;
      }

      // 2. Vérifier lesquels existent encore dans Postgres
      const idsArray = Array.from(spiceIds);
      const validResources = await db
        .select({ id: (table as any).id })
        .from(table as any)
        .where(inArray((table as any).id, idsArray));

      const validIds = new Set(validResources.map(r => r.id));
      
      // 3. Identifier les orphelins
      const orphans = idsArray.filter(id => !validIds.has(id));

      if (orphans.length > 0) {
        console.log(`  ⚠️ ${orphans.length} orphelin(s) détecté(s) pour ${type}. Nettoyage...`);
        for (const orphanId of orphans) {
          await deleteResourceRelationships(type, orphanId);
          console.log(`    🗑️ Supprimé: ${type}:${orphanId}`);
        }
      } else {
        console.log(`  ✅ Tous les objets ${type} sont synchronisés.`);
      }
    }

    console.log("\n✨ Travail terminé. SpiceDB est propre !");
    process.exit(0);

  } catch (error) {
    console.error("❌ Erreur lors du nettoyage Janitor:", error);
    process.exit(1);
  }
}

janitor();
