import useSWR from 'swr'
import { api, devHeaders } from '../lib/api'
import { useEffect } from 'react'
import { socket } from '../lib/socket'

export function useOnboardingRequests(gameId?: string) {
  const swr = useSWR(gameId ? ['onboarding-requests', gameId] : null, async () => {
    const res = await api.admin.onboarding[':gameId'].requests.$get({
      param: { gameId: gameId! },
      header: devHeaders()
    })
    if (!res.ok) return { requests: [] }
    return res.json()
  }, {
    refreshInterval: 30000 // Fallback toutes les 30s
  })

  useEffect(() => {
    if (!gameId) return;
    
    // On écoute le signal realtime
    function onNewRequest(data: any) {
      // data peut être l'objet request complet ou juste une notif
      swr.mutate();
    }

    socket.on('onboarding_request', onNewRequest);
    
    // On écoute aussi db_event car le trigger SQL peut aussi notifier 
    // des changements dans la table requests
    socket.on('onboarding_updated', onNewRequest);

    return () => { 
      socket.off('onboarding_request', onNewRequest);
      socket.off('onboarding_updated', onNewRequest);
    };
  }, [gameId, swr]);

  return swr;
}

export async function submitOnboardingRequest(requestId: string, result: any) {
  const res = await api.admin.onboarding.requests[':requestId'].submit.$post({
    param: { requestId },
    json: { result },
    header: devHeaders()
  })
  if (!res.ok) throw new Error('Erreur lors de la validation')
  return res.json()
}
