import useSWR, { mutate } from 'swr'
import { useEffect } from 'react'
import { api, devHeaders } from '../lib/api'
import { socket } from '../lib/socket'

export function useGameOnboarding(gameId?: string) {
  const swr = useSWR(gameId ? ['game-onboarding', gameId] : null, async () => {
    const res = await api.admin.onboarding[':gameId'].$get({
      param: { gameId: gameId! },
      header: devHeaders()
    })
    if (!res.ok) throw new Error('Erreur lors du chargement de l onboarding')
    return res.json()
  })

  useEffect(() => {
    if (!gameId) return;

    if (!socket.connected) socket.connect();

    socket.emit('join_game', gameId);

    function onUpdate(data: any) {
      swr.mutate(); // Invalide le cache et recharge
    }

    socket.on('onboarding_updated', onUpdate);

    return () => {
      socket.emit('leave_game', gameId);
      socket.off('onboarding_updated', onUpdate);
    };
  }, [gameId]); // Pas besoin de swr dans les dépendances

  return swr;
}

export function useGlobalOnboarding() {
  return useSWR(['global-onboarding'], async () => {
    const res = await api.admin.onboarding.global.$get({
      header: devHeaders()
    })
    if (!res.ok) throw new Error('Erreur lors du chargement de l onboarding global')
    return res.json()
  })
}

export async function triggerOnboardingStep(gameId: string, slug: string) {
  const res = await api.admin.onboarding[':gameId'][':slug'].trigger.$post({
    param: { gameId, slug },
    header: devHeaders()
  })
  if (!res.ok) throw new Error('Erreur lors du lancement')
  
  // Recharger les données pour voir le statut 'running'
  mutate(['game-onboarding', gameId])
  return res.json()
}