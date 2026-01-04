export function createOnboardingActivities(secrets: Record<string, string>) {
  const API_URL = secrets["API_URL"] || "http://localhost:3000";
  
  const SYSTEM_USER_ID = secrets["TEMPORAL_SYSTEM_USER_ID"];
  if (!SYSTEM_USER_ID) {
    throw new Error("❌ Configuration Error: Missing TEMPORAL_SYSTEM_USER_ID secret in Infisical");
  }

  const commonHeaders = {
    "Content-Type": "application/json",
    "x-user-id": SYSTEM_USER_ID
  };

  return {
    getOnboardingSteps: async (gameId: string): Promise<any> => {
      console.log(`🔍 [Activity] Fetching steps for game ${gameId}`);
      const res = await fetch(`${API_URL}/admin/onboarding/${gameId}`, { headers: commonHeaders });
      if (!res.ok) throw new Error(`Status ${res.status}: ${res.statusText}`);
      return await res.json();
    },

    // Normalisation : On accepte un objet unique pour toutes les activités
    triggerStep: async (params: { gameId: string, stepSlug: string }): Promise<any> => {
      const { gameId, stepSlug } = params;
      console.log(`🚀 [Activity] Triggering step ${stepSlug} for ${gameId}`);
      const res = await fetch(`${API_URL}/admin/onboarding/${gameId}/${stepSlug}/trigger`, {
        method: "POST",
        headers: commonHeaders
      });
      if (!res.ok) throw new Error(`Status ${res.status}: ${res.statusText}`);
      return await res.json();
    },

    createOnboardingRequest: async (params: { gameId: string, stepSlug: string, workflowId: string, type: string, config: any }): Promise<any> => {
      console.log(`🙋‍♂️ [Activity] Creating Request: ${params.type} for ${params.stepSlug}`);
      const res = await fetch(`${API_URL}/admin/onboarding/requests/create`, {
        method: "POST",
        headers: commonHeaders,
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error(`Failed to create request: ${res.statusText}`);
      return await res.json();
    },

    updateOnboardingStatus: async (params: { gameId: string, stepSlug: string, status: string, result?: any }): Promise<any> => {
      const { gameId, stepSlug, status, result = {} } = params;
      console.log(`💾 [Activity] Updating Status: ${stepSlug} -> ${status}`);
      const res = await fetch(`${API_URL}/admin/onboarding/${gameId}/${stepSlug}/complete`, {
        method: "POST",
        headers: commonHeaders,
        body: JSON.stringify({ status, result })
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to update status: ${err}`);
      }
      return await res.json();
    },

    validatePlatformConfig: async ({ gameId, platformSlug, workflowId }: { gameId: string, platformSlug: string, workflowId: string }): Promise<boolean> => {
      console.log(`🔍 [Activity] Validating config for platform ${platformSlug}`);
      
      const res = await fetch(`${API_URL}/admin/onboarding/${gameId}`, { headers: commonHeaders });
      const { configs } = await res.json();
      
      const platformConfig = configs.find((c: any) => c.slug === platformSlug);
      if (!platformConfig) return true; // Pas de config = rien à valider

      const missingFields = (platformConfig.configSchema as string[]).filter(field => !platformConfig.config[field]);

      if (missingFields.length > 0) {
        console.log(`⚠️ [Activity] Missing fields for ${platformSlug}: ${missingFields.join(', ')}`);
        
        // Créer une demande d'action (CONFIG_FORM)
        await fetch(`${API_URL}/admin/onboarding/requests/create`, {
          method: "POST",
          headers: commonHeaders,
          body: JSON.stringify({
            gameId,
            stepSlug: `config-${platformSlug}`,
            workflowId,
            type: 'CONFIG_FORM',
            config: {
              platformSlug,
              missingFields,
              title: `Configuration requise : ${platformSlug}`,
              description: `Veuillez renseigner les informations manquantes pour la plateforme ${platformSlug}.`
            }
          })
        });
        return false;
      }

      console.log(`✅ [Activity] Config for ${platformSlug} is valid`);
      return true;
    },

    validateAllPlatformConfigs: async ({ gameId, platforms: platformSlugs, workflowId }: { gameId: string, platforms: string[], workflowId: string }): Promise<boolean> => {
      console.log(`🔍 [Activity] Validating all platform configs: ${platformSlugs.join(', ')}`);
      
      const res = await fetch(`${API_URL}/admin/onboarding/${gameId}`, { headers: commonHeaders });
      const { configs } = await res.json();
      
      const batchMissing: any[] = [];

      for (const slug of platformSlugs) {
        const platformConfig = configs.find((c: any) => c.slug === slug);
        if (!platformConfig) continue;

        const missingFields = (platformConfig.configSchema as string[]).filter(field => !platformConfig.config[field]);
        if (missingFields.length > 0) {
          batchMissing.push({ platformSlug: slug, missingFields });
        }
      }

      if (batchMissing.length > 0) {
        console.log(`⚠️ [Activity] Missing fields detected for batch validation`);
        
        await fetch(`${API_URL}/admin/onboarding/requests/create`, {
          method: "POST",
          headers: commonHeaders,
          body: JSON.stringify({
            gameId,
            stepSlug: `config-platforms-batch`,
            workflowId,
            type: 'CONFIG_FORM',
            config: {
              isBatch: true,
              updates: batchMissing,
              title: `Configuration multi-plateformes requise`,
              description: `Certaines informations sont manquantes pour continuer l'onboarding.`
            }
          })
        });
        return false;
      }

      console.log(`✅ [Activity] All platform configs are valid`);
      return true;
    },

    getPlatformConfig: async (gameId: string, platformSlug: string): Promise<Record<string, any>> => {
      console.log(`🔍 [Activity] Fetching config for ${platformSlug} (Game: ${gameId})`);
      const res = await fetch(`${API_URL}/admin/games/${gameId}/platforms`, { headers: commonHeaders });
      if (!res.ok) throw new Error(`Failed to fetch platforms: ${res.statusText}`);
      
      const { integrations } = await res.json();
      const integration = integrations.find((i: any) => i.platformSlug === platformSlug);
      
      return integration?.config || {};
    }
  };
}
