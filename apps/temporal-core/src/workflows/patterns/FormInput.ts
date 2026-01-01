import { proxyActivities, condition, defineSignal, setHandler, workflowInfo } from '@temporalio/workflow';
import type { Activities } from '../../activities';

const { createOnboardingRequest, updateOnboardingStatus } = proxyActivities<Activities>({
  startToCloseTimeout: '1 minute',
});

const inputSignal = defineSignal<[any]>('onboarding_input_received');

export async function FormInputWorkflow(params: {
  gameId: string;
  stepSlug: string;
  config: {
    title: string;
    description?: string;
    formSchema: any[]; // Liste des champs
    targetTable?: string; // TODO: Pour sauvegarde spécifique plus tard
  };
}): Promise<string> {
  const { gameId, stepSlug, config } = params;
  const info = workflowInfo();
  let userInput: any = null;

  setHandler(inputSignal, (data) => {
    userInput = data;
  });

  // 1. Status Running
  await updateOnboardingStatus({ gameId, stepSlug, status: 'running' });

  // 2. Demande d'action (FORM)
  await createOnboardingRequest({
    gameId,
    stepSlug,
    workflowId: info.workflowId,
    type: 'CONFIG_FORM', // On réutilise ce type qui est déjà géré par ton DynamicFormDialog
    config: {
      title: config.title || "Formulaire",
      description: config.description || "Veuillez remplir les informations.",
      fields: config.formSchema, // Le frontend attend 'fields' ou 'missingFields' ? À vérifier avec DynamicFormDialog
      // Note: Ton frontend semble utiliser 'missingFields' pour les configs auto, 
      // mais on peut adapter DynamicFormDialog pour lire 'fields' aussi.
      targetTable: config.targetTable 
    }
  });

  // 3. Attente
  await condition(() => userInput !== null);

  // 4. TODO: Sauvegarde spécifique si targetTable est défini
  if (config.targetTable) {
    // await saveToTable(config.targetTable, userInput);
    console.log(`TODO: Save to table ${config.targetTable}`, userInput);
  }

  // 5. Completion
  await updateOnboardingStatus({ 
    gameId, 
    stepSlug, 
    status: 'completed', 
    result: userInput 
  });

  return "Form Input Completed";
}
