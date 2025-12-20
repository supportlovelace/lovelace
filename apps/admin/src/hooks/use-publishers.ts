import useSWR from 'swr'
import { api, devHeaders } from '../lib/api'

async function getJson(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export function usePublishers(enabled: boolean = true) {
  return useSWR(enabled ? ['publishers'] : null, async () => {
    const res = await api.admin.publishers.$get({ header: devHeaders() })
    return getJson(res)
  })
}

export function usePublisher(id?: string) {
  return useSWR(id ? ['publisher', id] : null, async () => {
    const res = await api.admin.publishers[':id'].$get({
      param: { id: id as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}

export function usePublisherStudios(id?: string) {
  return useSWR(id ? ['publisher-studios', id] : null, async () => {
    const res = await api.admin.publishers[':id'].studios.$get({
      param: { id: id as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}

export function usePublisherUsers(id?: string) {
  return useSWR(id ? ['publisher-users', id] : null, async () => {
    const res = await api.admin.publishers[':id'].users.$get({
      param: { id: id as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}
