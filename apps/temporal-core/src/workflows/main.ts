import { proxyActivities, workflowInfo, executeActivity, condition, defineSignal, setHandler, executeChild, isCancellation, CancellationScope } from '@temporalio/workflow';
import type { Activities } from '../activities';
import { CsvIngestionWorkflow } from './patterns/CsvIngestion';
import { KestraJobWorkflow } from './patterns/KestraJob';
import { FormInputWorkflow } from './patterns/FormInput';

const actions = proxyActivities<Activities>({
  startToCloseTimeout: '1 minute',
});

const inputSignal = defineSignal<[any]>('onboarding_input_received');

export async function MainOnboardingWorkflow(gameId: string): Promise<void> {
  const info = workflowInfo();
  let userInput: any = null;

  setHandler(inputSignal, (data) => {
    userInput = data;
  });

  // 1. RÉCUPÉRATION DU PLAN INITIAL
  const { onboarding: allSteps } = await actions.getOnboardingSteps(gameId);
  
  // 2. FILTRAGE DELTA (On ne propose que ce qui n'est pas fini ou déjà skipped)
  const stepsToProcess = allSteps.filter((s: any) => s.status !== 'completed' && s.status !== 'skipped');
  
  if (stepsToProcess.length === 0) {
    console.log("✅ Onboarding déjà complet pour ce jeu.");
    return;
  }

  try {
    // 3. VALIDATION DES CONFIGS
    const platforms = [...new Set(stepsToProcess.map((s: any) => s.platform).filter(Boolean))];
    
    for (const platform of platforms) {
      const isValid = await actions.validatePlatformConfig({ 
        gameId, 
        platformSlug: platform as string, 
        workflowId: info.workflowId 
      });

      if (!isValid) {
        console.log(`💤 [MainWorkflow] Config manquante pour ${platform}. En attente...`);
        await condition(() => userInput !== null);
        userInput = null;
      }
    }

    // 4. REVIEW PLAN (Sur les steps restants)
    await actions.createOnboardingRequest({
      gameId,
      stepSlug: 'global-plan-review',
      workflowId: info.workflowId,
      type: 'REVIEW_PLAN',
      config: { steps: stepsToProcess }
    });

    await condition(() => userInput !== null);
    const validatedSlugs = userInput.validatedSlugs as string[];
    userInput = null;

    // 5. MISE À JOUR DES STATUTS SKIPPED
    for (const step of stepsToProcess) {
      if (!validatedSlugs.includes(step.slug)) {
        await actions.updateOnboardingStatus({ gameId, stepSlug: step.slug, status: 'skipped' });
      }
    }

    // 6. EXÉCUTION PAR PLATEFORME
    const stepsToRun = stepsToProcess.filter((s: any) => validatedSlugs.includes(s.slug));
    const platformGroups = [...new Set(stepsToRun.map((s: any) => s.platform))];

    const results = await Promise.allSettled(platformGroups.map(async (platform) => {
      const platformSteps = stepsToRun.filter((s: any) => s.platform === platform);
      
      for (const step of platformSteps) {
        const config = step.executorConfig as any;
        
        if (config.onboardingType === 'CSV_INGESTION_PATTERN') {
          await executeChild(CsvIngestionWorkflow, {
            args: [{ gameId, stepSlug: step.slug, config: config.params }],
            workflowId: `csv-ingest-${gameId}-${step.slug}`,
          });
        } 
        else if (config.onboardingType === 'KESTRA_JOB_PATTERN') {
          await executeChild(KestraJobWorkflow, {
            args: [{ 
              gameId, 
              stepSlug: step.slug, 
              config: config.params,
              platform: step.platform
            }],
            workflowId: `kestra-job-${gameId}-${step.slug}`,
          });
        }
        else if (config.onboardingType === 'FORM_PATTERN') {
          await executeChild(FormInputWorkflow, {
            args: [{ gameId, stepSlug: step.slug, config: config.params }],
            workflowId: `form-input-${gameId}-${step.slug}`,
          });
        }
        else if (step.executorType === 'temporal_activity') {
          const activityName = config.activityName;
          const activityParams = config.params || {};

          if (activityName) {
            await actions.updateOnboardingStatus({ gameId, stepSlug: step.slug, status: 'running' });
            try {
              await (actions as any)[activityName]({ ...activityParams, gameId, stepSlug: step.slug, workflowId: info.workflowId });
              await actions.updateOnboardingStatus({ gameId, stepSlug: step.slug, status: 'completed' });
            } catch (e: any) {
              await actions.updateOnboardingStatus({ gameId, stepSlug: step.slug, status: 'error', result: { error: e.message } });
              throw e; // Rethrow to mark platform group as failed
            }
          }
        }
      }
    }));

    // Analyse des résultats
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`⚠️ ${failures.length} platform groups failed.`);
      // On peut décider de throw ici si on veut que le workflow soit marqué Failed à la fin
      // Si on veut "Partial Success", on ne throw pas.
      // Pour l'instant, on throw si tout a échoué, sinon on log juste.
      if (failures.length === results.length) {
        throw new Error("All onboarding steps failed.");
      }
    }

    console.log("🎉 Onboarding terminé (potentiellement partiel).");

  } catch (err) {
    if (isCancellation(err)) {
      console.log("🛑 Onboarding annulé.");
      // Protection du nettoyage contre l'annulation pour pouvoir appeler des activités
      await CancellationScope.nonCancellable(async () => {
        for (const step of stepsToProcess) {
          await actions.updateOnboardingStatus({ gameId, stepSlug: step.slug, status: 'cancelled' });
        }
      });
    }
    throw err;
  }
}
