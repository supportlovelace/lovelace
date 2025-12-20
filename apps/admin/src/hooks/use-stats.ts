import useSWR from 'swr'
import { api, devHeaders } from '../lib/api'

export function useStats() {
  return useSWR('admin-stats', async () => {
    const res = await api.admin.stats.$get({
      header: devHeaders()
    })
    if (!res.ok) throw new Error('Erreur stats')
    return res.json()
  })
}

export function useHealth() {
  return useSWR('api-health', async () => {
    // On utilise fetch direct pour éviter les problèmes de typage RPC sur la route root health
    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/health`)
    if (!res.ok) throw new Error('API Offline')
    return res.json()
  }, {
    refreshInterval: 30000 // On check toutes les 30s
  })
}
