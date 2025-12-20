import { hc } from 'hono/client'
import type { AppType } from '@lovelace/api/src/index.ts'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = hc<AppType>(API_BASE_URL)

export async function uploadAsset(file: File, type: 'game_logo' | 'platform_logo' | 'avatar', altText?: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  if (altText) formData.append('altText', altText)

  const res = await fetch(`${API_BASE_URL}/admin/assets/upload`, {
    method: 'POST',
    headers: {
      ...devHeaders(),
    },
    body: formData,
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Erreur lors de l’upload')
  }

  return res.json() as Promise<{ assetId: string }>
}

export function devHeaders() {
  const devUserId = (import.meta as any).env?.VITE_DEV_USER_ID
  if (!devUserId) throw new Error('VITE_DEV_USER_ID is not set in env')
  return { 'x-user-id': String(devUserId) }
}
