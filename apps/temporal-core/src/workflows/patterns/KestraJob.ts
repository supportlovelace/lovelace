import { proxyActivities, condition, defineSignal, setHandler, workflowInfo, ApplicationFailure } from '@temporalio/workflow';
import type { Activities } from '../../activities';

const { triggerKestraFlow, updateOnboardingStatus, getPlatformConfig } = proxyActivities<Activities>({
  startToCloseTimeout: '1 minute',
});

// Signal unifié pour tout l'onboarding (formulaire, job kestra, ingestion async)
const onboardingSignal = defineSignal<[any]>('onboarding_input_received');

export async function KestraJobWorkflow(params: {
  gameId: string;
  stepSlug: string;
  platform?: string | null;
  config: {
    flowId: string;
    namespace?: string;
    inputs?: any;
    timeout?: string;
  };
}): Promise<string> {
  const { gameId, stepSlug, platform, config } = params;
  const info = workflowInfo();
  let jobResult: { status: string, result: any } | null = null;

  setHandler(onboardingSignal, (payload) => {
    console.log(`📡 [KestraJob] Signal received: ${payload.status || 'SUCCESS'}`);
    // On adapte le payload pour rester compatible avec la logique suivante
    jobResult = {
      status: payload.status || 'SUCCESS',
      result: payload.result || payload
    };
  });

  try {
    await updateOnboardingStatus({ gameId, stepSlug, status: 'running' });

    // Récupération dynamique de la config plateforme si applicable
    let platformInputs = {};
    if (platform) {
      try {
        platformInputs = await getPlatformConfig(gameId, platform);
        console.log(`✨ [KestraJob] Injected config for ${platform}`);
      } catch (e) {
        console.warn(`⚠️ [KestraJob] Failed to fetch config for ${platform}, continuing without it.`);
      }
    }

    const finalInputs = {
      gameId,
      stepSlug,
      ...config.inputs,
      ...platformInputs
    };

    const kestraExec = await triggerKestraFlow({
      flowId: config.flowId,
      namespace: config.namespace || 'lovelace',
      temporalWorkflowId: info.workflowId,
      inputs: finalInputs,
      labels: {
        game_id: gameId,
        step_slug: stepSlug,
        platform: platform || 'global'
      }
    });

    console.log(`⏳ [KestraJob] Waiting for Kestra execution ${kestraExec.id}...`);

    const timeout = config.timeout || '1 hour';
    const finished = await condition(() => jobResult !== null, timeout);

    if (!finished) {
      throw new ApplicationFailure(`Kestra Job timed out after ${timeout}`);
    }

    if (jobResult?.status === 'SUCCESS') {
      const safeResult = (typeof jobResult.result === 'object' && jobResult.result !== null) ? jobResult.result : { raw: jobResult.result };
      
      await updateOnboardingStatus({ 
        gameId, 
        stepSlug, 
        status: 'completed', 
        result: {
          ...safeResult,
          id: kestraExec.id,
          flowId: config.flowId,
          namespace: config.namespace || 'lovelace'
        }
      });
      return "Kestra Job Completed Successfully";
    } else {
      await updateOnboardingStatus({ 
        gameId, 
        stepSlug, 
        status: 'error', 
        result: {
          kestraExecutionId: kestraExec.id,
          error: "Job returned FAILED status",
          details: jobResult?.result
        }
      });

      throw new ApplicationFailure(`Kestra Job Failed`, 'Error', undefined, [], {
        kestraExecutionId: kestraExec.id,
        error: "Job returned FAILED status"
      });
    }

  } catch (error: any) {
    console.error(`❌ [KestraJob] Error: ${error.message}`);
    await updateOnboardingStatus({ 
      gameId, 
      stepSlug, 
      status: 'error', 
      result: { error: error.message } 
    });
    throw error;
  }
}
