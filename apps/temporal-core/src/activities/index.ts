import { createOnboardingActivities } from "./onboarding";
import { createKestraActivities } from "./kestra";

export function createActivities(secrets: Record<string, string>) {
  return {
    ...createOnboardingActivities(secrets),
    ...createKestraActivities(secrets),
  };
}

// Type indispensable pour le proxyActivities dans les workflows
export type Activities = ReturnType<typeof createActivities>;
