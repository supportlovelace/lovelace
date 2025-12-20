import { hc } from 'hono/client'
import type { AppType } from '@lovelace/api/src/index.ts'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = hc<AppType>(API_BASE_URL)

export function devHeaders() {
  const devUserId = (import.meta as any).env?.VITE_DEV_USER_ID
  if (!devUserId) throw new Error('VITE_DEV_USER_ID is not set in env')
  return { 'x-user-id': String(devUserId) }
}
