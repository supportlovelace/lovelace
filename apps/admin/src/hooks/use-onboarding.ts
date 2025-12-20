import useSWR, { mutate } from 'swr'
import { api, devHeaders } from '../lib/api'

export function useGameOnboarding(gameId?: string) {
  return useSWR(gameId ? ['game-onboarding', gameId] : null, async () => {
    const res = await api.admin.onboarding[':gameId'].$get({
      param: { gameId: gameId! },
      header: devHeaders()
    })
    if (!res.ok) throw new Error('Erreur lors du chargement de l onboarding')
    return res.json()
  })
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