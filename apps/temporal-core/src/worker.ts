import 'dotenv/config';
import { Worker } from '@temporalio/worker';
import { InfisicalSDK } from "@infisical/sdk";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createActivities } from './activities/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function run() {
  const { 
    INFISICAL_CLIENT_ID, 
    INFISICAL_CLIENT_SECRET, 
    INFISICAL_PROJECT_ID,
    NODE_ENV = 'dev'
  } = process.env;

  console.log("DEBUG: ID chargé:", INFISICAL_CLIENT_ID ? `${INFISICAL_CLIENT_ID.substring(0, 4)}...` : "UNDEFINED");
  console.log("DEBUG: Secret chargé:", INFISICAL_CLIENT_SECRET ? `${INFISICAL_CLIENT_SECRET.substring(0, 4)}...` : "UNDEFINED");

  if (!INFISICAL_CLIENT_ID || !INFISICAL_CLIENT_SECRET || !INFISICAL_PROJECT_ID) {
    console.error("❌ Variables d'environnement Infisical manquantes !");
    console.table({ INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET, INFISICAL_PROJECT_ID });
    process.exit(1);
  }

  try {
    console.log("🔐 Connexion à Infisical (v4 SDK)...");
    const client = new InfisicalSDK({
      siteUrl: "https://eu.infisical.com"
    });

    await client.auth().universalAuth.login({
      clientId: INFISICAL_CLIENT_ID,
      clientSecret: INFISICAL_CLIENT_SECRET,
    });

    const allSecretsResponse = await client.secrets().listSecrets({
      environment: NODE_ENV,
      projectId: INFISICAL_PROJECT_ID,
    });

    const secrets = allSecretsResponse.secrets.reduce((acc, secret) => {
      acc[secret.secretKey] = secret.secretValue;
      return acc;
    }, {} as Record<string, string>);

    console.log(`✅ ${allSecretsResponse.secrets.length} secrets récupérés avec succès`);

    const worker = await Worker.create({
      workflowsPath: resolve(__dirname, './workflows/index.ts'),
      activities: createActivities(secrets),
      taskQueue: 'lovelace-core',
    });

    console.log('👷 Worker Temporal V2 démarré sur la queue "lovelace-core"');
    await worker.run();
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation du Worker:", error);
    process.exit(1);
  }
}

run();
