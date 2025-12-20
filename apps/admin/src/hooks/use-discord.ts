import useSWR from 'swr'
import { api, devHeaders } from '../lib/api'

export function useDiscordGuilds() {
  return useSWR('discord-guilds', async () => {
    const res = await api.admin.discord.guilds.$get({
      header: devHeaders()
    })
    if (!res.ok) throw new Error('Erreur lors du chargement des serveurs Discord')
    return res.json()
  })
}

export function useDiscordGuild(id?: string) {
  return useSWR(id ? `discord-guild-${id}` : null, async () => {
    const res = await api.admin.discord.guilds[':id'].$get({
      param: { id: id! },
      header: devHeaders()
    })
    if (!res.ok) throw new Error('Erreur lors du chargement des détails du serveur')
    return res.json()
  })
}
