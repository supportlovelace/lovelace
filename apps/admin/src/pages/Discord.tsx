import { useDiscordGuilds } from '../hooks/use-discord'
import { DataTable } from '../components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { MessageSquare, Shield, Users, Gamepad2 } from 'lucide-react'
import { useLocation } from 'wouter'

export function Discord() {
  const { data, isLoading, error } = useDiscordGuilds()
  const [, setLocation] = useLocation()

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Nom du Serveur",
      cell: ({ row }) => {
        const guild = row.original
        const iconUrl = guild.icon 
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
          : null

        return (
          <div className="flex items-center font-medium">
            {iconUrl ? (
              <img src={iconUrl} className="w-8 h-8 rounded-full mr-3 border shadow-sm" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full mr-3 bg-gray-100 flex items-center justify-center text-xs text-gray-400 border border-dashed">
                {guild.name.substring(0, 1)}
              </div>
            )}
            {guild.name}
          </div>
        )
      }
    },
    {
      accessorKey: "game",
      header: "Jeu Lovelace",
      cell: ({ row }) => {
        const game = row.original.game;
        return (
          <div className="flex items-center">
            {game ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 border border-green-100 text-green-700 text-xs font-bold shadow-sm">
                <Gamepad2 className="w-3.5 h-3.5" />
                {game.name}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic px-2">Non lié</div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "id",
      header: "ID Discord",
      cell: ({ row }) => <code className="text-[10px] font-mono text-gray-400">{row.getValue("id")}</code>
    },
    {
      accessorKey: "permissions",
      header: "Admin",
      cell: ({ row }) => {
        // En Discord API, si on a la perm ADMINISTRATOR ou MANAGE_GUILD
        const isOwner = row.original.owner
        return (
          <div className="flex items-center">
            {isOwner ? (
              <Shield className="w-4 h-4 text-orange-500 mr-1.5" />
            ) : (
              <Shield className="w-4 h-4 text-green-500 mr-1.5" />
            )}
            <span className="text-xs">{isOwner ? 'Owner' : 'Membre'}</span>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#5865F2]">Intégration Discord</h1>
          <p className="text-gray-500 text-sm">Surveillez l'activité du bot Lovelace sur les serveurs externes.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#5865F2]/10 px-4 py-2 rounded-lg border border-[#5865F2]/20">
          <MessageSquare className="w-5 h-5 text-[#5865F2]" />
          <span className="font-semibold text-[#5865F2]">Bot Lovelace</span>
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl text-red-600">
          {error.message}
        </div>
      ) : isLoading ? (
        <div className="p-8 text-center text-gray-500 bg-white border rounded-xl">
          Connexion à Discord en cours...
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={data?.guilds || []} 
          searchPlaceholder="Chercher un serveur..."
          onRowClick={(guild) => setLocation(`/discord/${guild.id}`)}
        />
      )}
    </div>
  )
}
