import { proxyActivities, condition, defineSignal, setHandler, workflowInfo, executeChild } from '@temporalio/workflow';
import type { Activities } from '../../activities';
import { KestraJobWorkflow } from './KestraJob';

const { createOnboardingRequest, updateOnboardingStatus } = proxyActivities<Activities>({
  startToCloseTimeout: '1 minute',
});

const inputSignal = defineSignal<[any]>('onboarding_input_received');

export async function CsvIngestionWorkflow(params: {
  gameId: string;
  stepSlug: string;
  config: any;
}): Promise<string> {
  const { gameId, stepSlug, config } = params;
  const info = workflowInfo();
  let userInput: any = null;

  setHandler(inputSignal, (data) => {
    userInput = data;
  });

  // 1. Status Running
  await updateOnboardingStatus({ gameId, stepSlug, status: 'running' });

  // 2. Création de la demande d'action (Human in the loop)
  await createOnboardingRequest({
    gameId,
    stepSlug,
    workflowId: info.workflowId,
    type: 'UPLOAD_CSV',
    config: {
      label: config.label || "Importation CSV",
      targetTable: config.targetTable,
      expectedColumns: config.expectedColumns,
      instructions: config.instructions || "Veuillez uploader et mapper votre fichier."
    }
  });

  // 3. Attente du Signal (Upload + Mapping validés par l'admin)
  await condition(() => userInput !== null);

  // 4. Lancement de l'ingestion Kestra
  // On délègue le travail lourd au pattern KestraJob
  console.log("📂 CSV Uploaded via UI. Triggering Kestra Ingestion...");
  
  await executeChild(KestraJobWorkflow, {
    args: [{
      gameId,
      stepSlug,
      platform: null, // CSV ingestion is usually generic, or we could pass it if available
      config: {
        flowId: "csv-ingestion",
        namespace: "lovelace.ingestion",
        timeout: "1 hour",
        inputs: {
          s3Key: userInput.s3Key,
          mapping: JSON.stringify(userInput.mapping), // On passe le mapping en string JSON pour Kestra env var
          targetTable: config.targetTable
        }
      }
    }],
    workflowId: `csv-ingest-kestra-${gameId}-${stepSlug}`
  });

  // 5. Completion (Géré par KestraJobWorkflow qui met à jour le statut, mais on peut logger ici)
  // Note: KestraJobWorkflow met le statut à 'completed' quand il finit.
  
  return `CSV Ingestion Success: ${stepSlug}`;
}
