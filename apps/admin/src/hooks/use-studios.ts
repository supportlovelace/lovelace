import useSWR from 'swr'
import { api, devHeaders } from '../lib/api'

async function getJson(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useStudios(enabled: boolean = true) {
  return useSWR(enabled ? ['studios'] : null, async () => {
    const res = await api.admin.studios.$get({ header: devHeaders() })
    return getJson(res)
  })
}

export function useStudio(id?: string) {
  return useSWR(id ? ['studio', id] : null, async () => {
    const res = await api.admin.studios[':id'].$get({
      param: { id: id as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}

export function useStudioGames(id?: string) {
  return useSWR(id ? ['studio-games', id] : null, async () => {
    const res = await api.admin.studios[':id'].games.$get({
      param: { id: id as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}

export function useStudioUsers(id?: string) {
  return useSWR(id ? ['studio-users', id] : null, async () => {
    const res = await api.admin.studios[':id'].users.$get({
      param: { id: id as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}