import 'dotenv/config';
import { InfisicalSDK } from "@infisical/sdk";
import { createOnboardingActivities } from '../src/activities/onboarding';

async function test() {
  console.log("🔐 Chargement secrets Infisical...");
  const client = new InfisicalSDK({ siteUrl: "https://eu.infisical.com" });
  await client.auth().universalAuth.login({
    clientId: process.env.INFISICAL_CLIENT_ID!,
    clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
  });
  const allSecretsResponse = await client.secrets().listSecrets({
    environment: "dev",
    projectId: process.env.INFISICAL_PROJECT_ID!,
  });
  const secrets = allSecretsResponse.secrets.reduce((acc, s) => ({ ...acc, [s.secretKey]: s.secretValue }), {} as Record<string, string>);

  const activities = createOnboardingActivities(secrets);

  const gameId = "82d9eb39-043f-4735-bca5-f517a4a64326";
  const slug = "test-discord-step";
  
  console.log(`🚀 Test: updateOnboardingStatus (${slug} -> running)...`);
  
  try {
    const result = await activities.updateOnboardingStatus(gameId, slug, 'running', { test: true });
    console.log("🎉 SUCCÈS ! Regarde ton Admin UI, elle devrait afficher 'En cours'.");
    console.log("Réponse API:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("💥 ÉCHEC de l'activité :", e);
  }
}

test().catch(console.error);
