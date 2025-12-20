import { useLocation } from "wouter"
import { useGames } from '../hooks/use-games'
import { DataTable } from '../components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Gamepad2, Building2, LayoutGrid, Calendar } from 'lucide-react'

const CDN_URL = import.meta.env.VITE_CDN_URL ?? 'https://cdn.lovelace.gg'

export function Games() {
  const [, setLocation] = useLocation()
  const { data: gamesData, isLoading } = useGames()

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Nom du Jeu",
      cell: ({ row }) => (
        <div className="flex items-center font-medium">
          {row.original.logoAssetId ? (
            <img 
              src={`${CDN_URL}/assets/${row.original.logoAssetId}/48.webp`} 
              className="w-8 h-8 rounded mr-2 object-cover border" 
              alt="" 
            />
          ) : (
            <Gamepad2 className="w-4 h-4 mr-2 text-green-500" />
          )}
          {row.getValue("name")}
        </div>
      )
    },
    {
      accessorKey: "publisherName",
      header: "Publisher",
      cell: ({ row }) => (
        <div className="flex items-center text-sm text-gray-600">
          <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
          {row.getValue("publisherName") || "-"}
        </div>
      )
    },
    {
      accessorKey: "studioName",
      header: "Studio",
      cell: ({ row }) => (
        <div className="flex items-center text-sm text-gray-600">
          <LayoutGrid className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
          {row.getValue("studioName") || "-"}
        </div>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Date de création",
      cell: ({ row }) => (
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          {row.getValue("createdAt") ? new Date(row.getValue("createdAt") as string).toLocaleDateString() : "-"}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalogue des Jeux</h1>
          <p className="text-gray-500">Liste globale de tous les jeux de la plateforme.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-lg border">Chargement du catalogue...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={gamesData?.games || []} 
          onRowClick={(game) => setLocation(`/games/${game.id}`)}
        />
      )}
    </div>
  )
}