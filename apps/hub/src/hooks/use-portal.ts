import useSWR from 'swr'
import { api, devHeaders } from '../lib/api'

async function getJson(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export function usePortalBootstrap() {
  return useSWR(['portal-bootstrap'], async () => {
    const res = await api.portal.bootstrap.$get({
      header: devHeaders(),
    })
    return getJson(res)
  })
}

// Optionnel: on peut garder les hooks spécifiques mais les faire pointer 
// vers le cache du bootstrap par défaut pour éviter les requêtes inutiles
export function usePortalGames() {
  const { data } = usePortalBootstrap()
  return {
    data: data ? { games: data.games } : undefined,
    isLoading: !data
  }
}

export function useMe() {
  const { data } = usePortalBootstrap()
  return {
    data: data ? data.user : undefined,
    isLoading: !data
  }
}