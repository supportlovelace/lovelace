import useSWR from 'swr'
import { api, devHeaders } from '../lib/api'

async function getJson(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useUsers(enabled: boolean = true) {
  return useSWR(enabled ? ['users'] : null, async () => {
    const res = await api.admin.users.$get({ header: devHeaders() })
    return getJson(res)
  })
}

export function useUserPermissions(userId?: string) {
  return useSWR(userId ? ['user-perms', userId] : null, async () => {
    const res = await api.admin.users[':id'].permissions.$get({
      param: { id: userId as string },
      header: devHeaders(),
    })
    return getJson(res)
  })
}
