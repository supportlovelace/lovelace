import useSWR from 'swr'
import { api, devHeaders } from '../lib/api'

async function getJson(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useGames(enabled: boolean = true) {
  return useSWR(enabled ? ['admin-games'] : null, async () => {
    const res = await api.admin.games.$get({ header: devHeaders() })
    return getJson(res)
  })
}

export function useGame(id?: string) {
  return useSWR(id ? ['game', id] : null, async () => {
    const res = await api.admin.games[':id'].$get({
      param: { id: id as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}

export function useGameUsers(id?: string) {
  return useSWR(id ? ['game-users', id] : null, async () => {
    const res = await api.admin.games[':id'].users.$get({
      param: { id: id as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}

export function useGameRoles(id?: string) {
  return useSWR(id ? ['game-roles', id] : null, async () => {
    const res = await (api.admin.games[':id'] as any).roles.$get({
      param: { id: id as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}
