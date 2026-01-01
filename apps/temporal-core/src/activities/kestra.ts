export function createKestraActivities(secrets: Record<string, string>) {
  const KESTRA_URL = secrets["KESTRA_API_URL"];
  const KESTRA_EMAIL = secrets["KESTRA_USER_EMAIL"];
  const KESTRA_PASSWORD = secrets["KESTRA_USER_PASSWORD"];

  if (!KESTRA_URL) throw new Error("❌ Missing KESTRA_API_URL secret");
  if (!KESTRA_EMAIL || !KESTRA_PASSWORD) console.warn("⚠️ Kestra Auth secrets missing (KESTRA_USER_EMAIL/PASSWORD). Assuming no auth.");

  const getAuthHeaders = () => {
    if (KESTRA_EMAIL && KESTRA_PASSWORD) {
      const token = Buffer.from(`${KESTRA_EMAIL}:${KESTRA_PASSWORD}`).toString('base64');
      return { "Authorization": `Basic ${token}` };
    }
    return {};
  };

  return {
    triggerKestraFlow: async (params: { 
      flowId: string; 
      namespace: string; 
      temporalWorkflowId: string;
      inputs?: Record<string, any>;
      labels?: Record<string, string>;
    }): Promise<any> => {
      const { flowId, namespace, temporalWorkflowId, inputs = {}, labels = {} } = params;
      
      console.log(`🚀 [Activity] Triggering Kestra Flow: ${namespace}.${flowId}`);

      // Injection du callback ID pour Kestra
      const finalInputs = {
        ...inputs,
        temporalWorkflowId
      };

      const formData = new FormData();
      Object.entries(finalInputs).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // Construction de l'URL avec les labels
      const url = new URL(`${KESTRA_URL}/api/v1/executions/${namespace}/${flowId}`);
      Object.entries(labels).forEach(([key, value]) => {
        url.searchParams.append('labels', `${key}:${value}`);
      });

      try {
        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
          body: formData, 
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Kestra API Error (${response.status}): ${text}`);
        }

        const execution = await response.json();
        console.log(`✅ [Activity] Kestra Execution Started: ${execution.id}`);
        return execution;
      } catch (error: any) {
        console.error("❌ [Activity] Failed to trigger Kestra:", error);
        throw error;
      }
    }
  };
}
