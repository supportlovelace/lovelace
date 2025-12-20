import useSWR from 'swr'
import { api, devHeaders } from '../lib/api'

async function getJson(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export function usePlatforms() {
  return useSWR(['platforms'], async () => {
    const res = await api.admin.platforms.$get({ header: devHeaders() })
    return getJson(res)
  })
}

export function usePlatform(id?: string) {
  return useSWR(id ? ['platform', id] : null, async () => {
    const res = await api.admin.platforms[':id'].$get({
      param: { id: id! },
      header: devHeaders()
    })
    return getJson(res)
  })
}

export function usePlatformOnboarding(id?: string) {
  return useSWR(id ? ['platform-onboarding', id] : null, async () => {
    const res = await api.admin.platforms[':id']['onboarding-steps'].$get({
      param: { id: id! },
      header: devHeaders()
    })
    return getJson(res)
  })
}

export function useGamePlatforms(gameId?: string) {
  return useSWR(gameId ? ['game-platforms', gameId] : null, async () => {
    const res = await api.admin.games[':id'].platforms.$get({
      param: { id: gameId as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}
