import { proxyActivities, condition, defineSignal, setHandler, workflowInfo, ApplicationFailure } from '@temporalio/workflow';
import type { Activities } from '../../activities';

const { createOnboardingRequest, updateOnboardingStatus, triggerKestraFlow } = proxyActivities<Activities>({
  startToCloseTimeout: '1 minute',
});

const inputSignal = defineSignal<[any]>('onboarding_input_received');
const kestraSignal = defineSignal<[{ status: string, result: any }]>('kestra_job_completed');

export async function CsvIngestionWorkflow(params: {
  gameId: string;
  stepSlug: string;
  config: any;
}): Promise<string> {
  const { gameId, stepSlug, config } = params;
  const info = workflowInfo();
  
  let userInput: any = null;
  let jobResult: { status: string, result: any } | null = null;

  setHandler(inputSignal, (data) => {
    userInput = data;
  });

  setHandler(kestraSignal, (data) => {
    jobResult = data;
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

  // 3. Attente de l'upload utilisateur
  await condition(() => userInput !== null);

  // 4. Lancement direct de l'ingestion Kestra
  console.log("📂 CSV Uploaded. Triggering Kestra Ingestion directly...");
  
  const kestraExec = await triggerKestraFlow({
    flowId: "csv-ingestion",
    namespace: "lovelace.ingestion",
    temporalWorkflowId: info.workflowId, // C'est NOUS qu'il faut rappeler
    inputs: {
      gameId: gameId,
      stepSlug: stepSlug,
      s3Key: userInput.s3Key,
      mapping: JSON.stringify(userInput.mapping),
      targetTable: config.targetTable
    },
    labels: {
      game_id: gameId,
      step_slug: stepSlug,
      platform: "global" // CSV ingestion est souvent agnostique
    }
  });

  console.log(`⏳ Waiting for Kestra execution ${kestraExec.id}...`);

  // 5. Attente de la fin du job Kestra
  const timeout = "1 hour";
  const finished = await condition(() => jobResult !== null, timeout);

  if (!finished) {
    throw new ApplicationFailure(`CSV Ingestion timed out after ${timeout}`);
  }

  // 6. Finalisation
  if (jobResult?.status === 'SUCCESS') {
    const safeResult = (typeof jobResult.result === 'object' && jobResult.result !== null) ? jobResult.result : { raw: jobResult.result };
    
    await updateOnboardingStatus({ 
      gameId, 
      stepSlug, 
      status: 'completed', 
      result: {
        ...safeResult,
        id: kestraExec.id,
        flowId: "csv-ingestion",
        namespace: "lovelace.ingestion"
      }
    });
    return `CSV Ingestion Success: ${stepSlug}`;
  } else {
    throw new ApplicationFailure(`CSV Ingestion Failed`, 'Error', undefined, [], {
      kestraExecutionId: kestraExec.id,
      error: "Job returned FAILED status"
    });
  }
}
