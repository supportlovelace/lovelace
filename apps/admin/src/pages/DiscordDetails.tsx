import { useRoute, useLocation } from "wouter"
import { useDiscordGuild } from '../hooks/use-discord'
import { Button } from '@repo/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card"
import { ArrowLeft, Users, ShieldCheck, Zap, Hash, Globe, Crown } from 'lucide-react'

export function DiscordDetails() {
  const [, params] = useRoute("/discord/:id")
  const [, setLocation] = useLocation()
  const guildId = params?.id
  
  const { data, isLoading, error } = useDiscordGuild(guildId)

  if (isLoading) return <div className="p-8 text-center text-gray-500">Chargement des données Discord...</div>
  if (error || !data?.guild) return <div className="p-8 text-center text-red-600">Erreur : {error?.message || "Serveur non trouvé"}</div>

  const guild = data.guild
  const iconUrl = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=512` : null
  const bannerUrl = guild.banner ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=1024` : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/discord")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Détails du Serveur</h1>
      </div>

      {/* Banner & Profile */}
      <div className="relative">
        <div className="h-48 w-full rounded-xl bg-[#5865F2] overflow-hidden border shadow-sm">
          {bannerUrl ? (
            <img src={bannerUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <Globe className="w-24 h-24 text-white" />
            </div>
          )}
        </div>
        <div className="absolute -bottom-12 left-8 flex items-end gap-6">
          <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-lg border">
            {iconUrl ? (
              <img src={iconUrl} className="w-full h-full rounded-[1.25rem] object-cover" alt="" />
            ) : (
              <div className="w-full h-full rounded-[1.25rem] bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                {guild.name.substring(0, 1)}
              </div>
            )}
          </div>
          <div className="mb-2 bg-white/80 backdrop-blur-sm px-4 py-1 rounded-lg border">
            <h2 className="text-2xl font-bold text-gray-900">{guild.name}</h2>
            <p className="text-xs text-gray-500 font-mono">{guild.id}</p>
          </div>
        </div>
      </div>

      <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Audience & Membres
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 font-medium">Total Membres</p>
              <p className="text-4xl font-bold">{guild.approximate_member_count?.toLocaleString() || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 font-medium">En Ligne</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <p className="text-4xl font-bold">{guild.approximate_presence_count?.toLocaleString() || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" />
              Propriétés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <Crown className="w-4 h-4 text-orange-400" /> Owner
              </span>
              <span className="text-sm font-medium">{guild.owner ? 'Oui' : 'Non (Bot)'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <Zap className="w-4 h-4 text-pink-500" /> Boosts
              </span>
              <span className="text-sm font-medium">Niveau {guild.premium_tier}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <Hash className="w-4 h-4" /> Région
              </span>
              <span className="text-sm font-medium capitalize">{guild.region || 'Auto'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description / Features */}
      {guild.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description du serveur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{guild.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
