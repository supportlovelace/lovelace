import useSWR from 'swr';
import { api, devHeaders } from '../lib/api';

export function useAlerts() {
  const { data, error, isLoading, mutate } = useSWR(['monitoring-alerts'], async () => {
    const res = await api.admin.monitoring.alerts.$get({
      header: devHeaders(),
    });
    if (!res.ok) throw new Error('Erreur lors de la récupération des alertes');
    return res.json();
  });

  return {
    data,
    error,
    isLoading,
    mutate
  };
}

export function useAlertEvents(fingerprint: string | null) {
  const { data, error, isLoading } = useSWR(fingerprint ? ['alert-events', fingerprint] : null, async () => {
    const res = await api.admin.monitoring.alerts[':fingerprint'].events.$get({
      param: { fingerprint: fingerprint! },
      header: devHeaders(),
    });
    if (!res.ok) throw new Error('Erreur lors de la récupération des événements');
    return res.json();
  });

  return {
    events: data?.events || [],
    error,
    isLoading
  };
}