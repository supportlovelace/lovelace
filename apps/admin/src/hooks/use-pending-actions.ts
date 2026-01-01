import useSWR from 'swr'
import { api, devHeaders } from '../lib/api'
import { useEffect } from 'react'
import { socket } from '../lib/socket'

export function usePendingActions() {
  const { data, error, mutate } = useSWR('global-pending-requests', async () => {
    const res = await api.admin.onboarding.requests.pending.$get({
      header: devHeaders()
    })
    if (!res.ok) return { requests: [] }
    return await res.json()
  }, {
    refreshInterval: 30000 // Polling toutes les 30s en fallback
  })

  useEffect(() => {
    function onNewRequest() {
      mutate();
    }
    
    // On écoute les notifications Socket.IO
    socket.on('onboarding_request', onNewRequest);
    socket.on('onboarding_updated', onNewRequest);

    return () => {
      socket.off('onboarding_request', onNewRequest);
      socket.off('onboarding_updated', onNewRequest);
    };
  }, [mutate]);

  return {
    requests: (data?.requests || []) as any[],
    isLoading: !error && !data,
    mutate
  }
}
