import { useState } from 'react'
import { useRoute, useLocation } from "wouter"
import { useUserPermissions } from '../hooks/use-users'
import { Button } from '@repo/ui/components/ui/button'
import { DataTable } from '../components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Users, Shield, ArrowLeft, Building2, Gamepad2, LayoutGrid, Plus, Eye, Trash2 } from 'lucide-react'
import { ResourceAssignDialog } from '../components/resource-assign-dialog'
import { api, devHeaders } from '../lib/api'
import { mutate } from 'swr'
import { toast } from 'sonner'

export function UserDetails() {
  const [, params] = useRoute("/users/:id")
  const [, setLocation] = useLocation()
  const userId = params?.id
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  
  const { data: permsData, isLoading: permsLoading } = useUserPermissions(userId)
  const user = permsData?.user

  const onRemoveAccess = async (item: any) => {
    if (!confirm(`Retirer l'accès ${item.role} à ${item.resourceName} ?`)) return

    try {
      if (item.type === 'publisher') {
        await api.admin.publishers[':id'].users.$post({
          param: { id: item.id },
          json: { userId: userId!, role: item.role, action: 'remove' },
          header: devHeaders(),
        })
      } else if (item.type === 'studio') {
        await api.admin.studios[':id'].users.$post({
          param: { id: item.id },
          json: { userId: userId!, role: item.role, action: 'remove' },
          header: devHeaders(),
        })
      } else if (item.type === 'game') {
        await api.admin.games[':id'].users.$post({
          param: { id: item.id },
          json: { userId: userId!, role: item.role, action: 'remove' },
          header: devHeaders(),
        })
      }
      
      await mutate(['user-perms', userId])
      toast.success("Accès retiré")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors du retrait")
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <div className="flex items-center gap-2">
            {type === 'publisher' && <Building2 className="w-4 h-4 text-blue-500" />}
            {type === 'studio' && <Gamepad2 className="w-4 h-4 text-purple-500" />}
            {type === 'game' && <LayoutGrid className="w-4 h-4 text-green-500" />}
            <span className="capitalize">{type}</span>
          </div>
        )
      }
    },
    {
      accessorKey: "resourceName",
      header: "Ressource",
      cell: ({ row }) => <span className="font-medium">{row.getValue("resourceName")}</span>
    },
    {
      accessorKey: "role",
      header: "Rôle",
      cell: ({ row }) => (
        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          row.getValue("role") === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {row.getValue("role")}
        </div>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation(`/${item.type}s/${item.id}`)}
              title="Voir la ressource"
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onRemoveAccess(item)}
              title="Retirer l'accès"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )
      }
    }
  ]

  if (permsLoading) return <div className="p-8 text-center">Chargement...</div>
  if (!user) return <div className="p-8 text-center text-red-600">Utilisateur non trouvé</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/users")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          </div>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Détails du compte utilisateur.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">ID Unique</label>
              <p className="mt-1 font-mono text-xs">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Statut</label>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Actif</span>
                </div>
                {permsData?.isSuperAdmin && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-md border border-purple-200 w-fit">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-tight">Super Admin Global</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permissions & Accès</CardTitle>
                <CardDescription>Liste de toutes les ressources auxquelles cet utilisateur a accès.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAssignOpen(true)}>
                <Shield className="w-4 h-4 mr-2" />
                Donner un accès
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={permsData?.permissions || []} 
            />
          </CardContent>
        </Card>
      </div>

      {userId && (
        <ResourceAssignDialog 
          userId={userId} 
          userName={user.name} 
          open={isAssignOpen} 
          onOpenChange={setIsAssignOpen} 
        />
      )}
    </div>
  )
}