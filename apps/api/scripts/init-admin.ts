import { db } from "../src/db";
import { users } from "../src/db/schema";
import { spicedbClient } from "../src/authz/client";
import { v1 } from "@authzed/authzed-node";
import { Metadata } from "@grpc/grpc-js";
import { eq } from "drizzle-orm";

// Configuration
const ADMIN_EMAIL = "admin@lovelace.com";
const ADMIN_NAME = "Admin Lovelace";

function makeAuthMetadata(): Metadata {
  const md = new Metadata();
  const token = process.env.SPICEDB_GRPC_TOKEN || "secret";
  if (token) md.set("authorization", `Bearer ${token}`);
  return md;
}

async function initAdmin() {
  console.log("🚀 Initialisation du Super Admin Lovelace...");

  try {
    // 1. Créer ou récupérer l'utilisateur dans PostgreSQL
    let userId: string;
    const [existing] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL));

    if (existing) {
      console.log(`ℹ️ L'utilisateur ${ADMIN_EMAIL} existe déjà dans Postgres.`);
      userId = existing.id;
    } else {
      const [newUser] = await db.insert(users).values({
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
      }).returning();
      console.log(`✅ Utilisateur créé dans Postgres (ID: ${newUser.id})`);
      userId = newUser.id;
    }

    // 2. Donner les droits Super Admin dans SpiceDB
    console.log("🔗 Attribution des droits Super Admin dans SpiceDB...");
    const md = makeAuthMetadata();
    
    const update = v1.RelationshipUpdate.create({
      operation: v1.RelationshipUpdate_Operation.TOUCH,
      relationship: v1.Relationship.create({
        resource: v1.ObjectReference.create({ objectType: "lovelace_system", objectId: "lovelace" }),
        relation: "super_admin",
        subject: v1.SubjectReference.create({
          object: v1.ObjectReference.create({ objectType: "user", objectId: userId })
        }),
      }),
    });

    await spicedbClient.promises.writeRelationships(
      v1.WriteRelationshipsRequest.create({ updates: [update] }),
      md
    );

    console.log(`
✨ Terminé !`);
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🆔 ID: ${userId}`);
    console.log(`👑 Statut: Super Admin Global`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    process.exit(1);
  }
}

initAdmin();
