import { db } from "../src/db";
import { onboardingSteps } from "../src/db/schema";

async function seed() {
  console.log("🌱 Initialisation du catalogue d'onboarding...");

  const steps = [
    // GÉNÉRAL
    {
      slug: "general-init-authz",
      platform: null,
      title: "Initialisation des permissions",
      description: "Crée les structures de base dans SpiceDB pour ce jeu.",
      order: 1,
      executorType: "script",
      executorConfig: { script: "init-spice.ts" }
    },
    // STEAM
    {
      slug: "steam-sync-metadata",
      platform: "steam",
      title: "Sync Métadonnées Steam",
      description: "Récupère le nom, la description et les tags officiels via l'AppID.",
      order: 10,
      executorType: "kestra",
      executorConfig: { flowId: "steam-metadata-sync" }
    },
    {
      slug: "steam-fetch-reviews",
      platform: "steam",
      title: "Import des Reviews Historiques",
      description: "Récupère l'intégralité des reviews Steam pour l'analyse de sentiment.",
      order: 11,
      dependsOn: ["steam-sync-metadata"],
      executorType: "kestra",
      executorConfig: { flowId: "steam-reviews-import" }
    },
    // REDDIT
    {
      slug: "reddit-sync-posts",
      platform: "reddit",
      title: "Sync Subreddits",
      description: "Analyse les subreddits liés et importe les posts des 12 derniers mois.",
      order: 20,
      executorType: "kestra",
      executorConfig: { flowId: "reddit-posts-sync" }
    }
  ];

  try {
    for (const step of steps) {
      await db.insert(onboardingSteps).values(step).onConflictDoUpdate({
        target: onboardingSteps.slug,
        set: step
      });
      console.log(`✅ Étape configurée : ${step.slug}`);
    }
    console.log("\n✨ Catalogue prêt !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    process.exit(1);
  }
}

seed();
