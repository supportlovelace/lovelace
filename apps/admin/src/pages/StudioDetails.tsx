import { useState, useEffect } from 'react'
import { useRoute, useLocation } from "wouter"
import { useStudio, useStudioGames, useStudioUsers } from '../hooks/use-studios'
import { useUsers } from '../hooks/use-users'
import { mutate } from 'swr'
import { api, devHeaders } from '../lib/api'
import { Button } from '@repo/ui/components/ui/button'
import { DataTable } from '../components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@repo/ui/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/ui/form'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Combobox } from '@repo/ui/components/ui/combobox'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Gamepad2, Users, Plus, ShieldCheck, ArrowLeft, Building2, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { ImageUpload } from '../components/image-upload'

const CDN_URL = import.meta.env.VITE_CDN_URL ?? 'https://cdn.lovelace.gg'

const gameSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  logoAssetId: z.string().nullable().optional(),
})

const studioSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
})

const userAssignSchema = z.object({
  userId: z.string().min(1, "L'utilisateur est requis"),
  role: z.enum(["admin", "member"]),
})

export function StudioDetails() {
  const [, params] = useRoute("/studios/:id")
  const [, setLocation] = useLocation()
  const studioId = params?.id
  
  const { data: studioData, isLoading: studioLoading } = useStudio(studioId)
  const { data: gamesData, isLoading: gamesLoading } = useStudioGames(studioId)
  const { data: usersRelationsData, isLoading: usersLoading } = useStudioUsers(studioId)
  const { data: allUsersData } = useUsers()
  
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const gameForm = useForm<z.infer<typeof gameSchema>>({
    resolver: zodResolver(gameSchema),
    defaultValues: { name: "", description: "", logoAssetId: null }
  })

  const studioForm = useForm<z.infer<typeof studioSchema>>({
    resolver: zodResolver(studioSchema),
    defaultValues: { name: "", description: "" }
  })

  const userForm = useForm<z.infer<typeof userAssignSchema>>({
    resolver: zodResolver(userAssignSchema),
    defaultValues: { userId: "", role: "member" }
  })

  useEffect(() => {
    if (studioData?.studio) {
      studioForm.reset({
        name: studioData.studio.name,
        description: studioData.studio.description || "",
      })
    }
  }, [studioData, studioForm])

  const onUpdateStudio = async (values: z.infer<typeof studioSchema>) => {
    if (!studioId) return
    setActionLoading(true)
    try {
      await api.admin.studios[':id'].$put({
        param: { id: studioId },
        json: values,
        header: devHeaders(),
      })
      await mutate(['studio', studioId])
      setIsEditDialogOpen(false)
      toast.success("Studio mis à jour")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setActionLoading(false)
    }
  }

  const onDeleteStudio = async () => {
    if (!studioId) return
    setActionLoading(true)
    try {
      await api.admin.studios[':id'].$delete({
        param: { id: studioId },
        header: devHeaders(),
      })
      toast.success("Studio supprimé")
      setLocation(studioData?.studio?.publisherId ? `/publishers/${studioData.studio.publisherId}` : '/publishers')
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la suppression")
    } finally {
      setActionLoading(false)
    }
  }

  const onGameSubmit = async (values: z.infer<typeof gameSchema>) => {
    if (!studioId) return
    setActionLoading(true)
    try {
      await api.admin.games.$post({
        json: { ...values, studioId },
        header: devHeaders(),
      })
      await mutate(['studio-games', studioId])
      setIsGameDialogOpen(false)
      gameForm.reset()
      toast.success("Jeu créé")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la création du jeu")
    } finally {
      setActionLoading(false)
    }
  }

  const onUserSubmit = async (values: z.infer<typeof userAssignSchema>) => {
    if (!studioId) return
    setActionLoading(true)
    try {
      await api.admin.studios[':id'].users.$post({
        param: { id: studioId },
        json: { ...values, action: "add" },
        header: devHeaders(),
      })
      await mutate(['studio-users', studioId])
      setIsUserDialogOpen(false)
      userForm.reset()
      toast.success("Accès assigné")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de l'assignation")
    } finally {
      setActionLoading(false)
    }
  }

  const onRemoveUser = async (userId: string, role: 'admin'|'member') => {
    if (!studioId) return
    if (!confirm("Voulez-vous vraiment retirer cet accès ?")) return

    try {
      await api.admin.studios[':id'].users.$post({
        param: { id: studioId },
        json: { userId, role, action: "remove" },
        header: devHeaders(),
      })
      await mutate(['studio-users', studioId])
      toast.success("Accès retiré")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors du retrait de l'accès")
    }
  }

  const gameColumns: ColumnDef<any>[] = [
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
      accessorKey: "createdAt",
      header: "Créé le",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString()
    }
  ]

  const userColumns: ColumnDef<any>[] = [
    {
      accessorKey: "user.name",
      header: "Nom",
      cell: ({ row }) => row.original.user?.name || "Utilisateur inconnu"
    },
    {
      accessorKey: "user.email",
      header: "Email",
      cell: ({ row }) => row.original.user?.email || "-"
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
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onRemoveUser(row.original.userId, row.original.role)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  if (studioLoading) return <div className="p-8 text-center">Chargement du studio...</div>
  if (!studioData?.studio) return <div className="p-8 text-center text-red-600">Studio non trouvé</div>

  const studio = studioData.studio

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/publishers/${studio.publisherId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-purple-600" />
              <h1 className="text-3xl font-bold tracking-tight">{studio.name}</h1>
            </div>
            <p className="text-gray-500 flex items-center gap-1">
              Studio de 
              <Button variant="link" className="p-0 h-auto font-normal" onClick={() => setLocation(`/publishers/${studio.publisherId}`)}>
                {studio.publisherName}
              </Button>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="infos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="games">Jeux ({gamesData?.games?.length || 0})</TabsTrigger>
          <TabsTrigger value="users">Membres ({usersRelationsData?.userRelations?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Détails du Studio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1">{studio.description || "Aucune description."}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Rattaché au Publisher</label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span>{studio.publisherName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Jeux développés</h2>
            <Button size="sm" onClick={() => setIsGameDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Jeu
            </Button>
          </div>
          
          {gamesLoading ? (
            <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-lg border">Chargement...</div>
          ) : (
            <DataTable 
              columns={gameColumns} 
              data={gamesData?.games || []} 
              onRowClick={(game) => setLocation(`/games/${game.id}`)}
            />
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des membres Studio</h2>
            <Button size="sm" variant="outline" onClick={() => setIsUserDialogOpen(true)}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              Assigner un utilisateur
            </Button>
          </div>
          
          {usersLoading ? (
            <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-lg border">Chargement...</div>
          ) : (
            <DataTable 
              columns={userColumns} 
              data={usersRelationsData?.userRelations || []} 
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Edit Studio */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Studio</DialogTitle>
          </DialogHeader>
          <Form {...studioForm}>
            <form onSubmit={studioForm.handleSubmit(onUpdateStudio)} className="space-y-4">
              <FormField
                control={studioForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={studioForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={actionLoading}>Enregistrer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Delete Studio */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le Studio ?</DialogTitle>
            <DialogDescription className="text-red-600">
              Attention : Cette action est irréversible. Elle supprimera également tous les jeux associés et les accès.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={onDeleteStudio} disabled={actionLoading}>
              {actionLoading ? "Suppression..." : "Confirmer la suppression"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouveau Jeu */}
      <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau Jeu</DialogTitle>
            <DialogDescription>Ajouter un projet de jeu au catalogue du studio {studio.name}.</DialogDescription>
          </DialogHeader>
          <Form {...gameForm}>
            <form onSubmit={gameForm.handleSubmit(onGameSubmit)} className="space-y-4">
              <FormField
                control={gameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du Jeu</FormLabel>
                    <FormControl><Input placeholder="Ex: Project X" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={gameForm.control}
                name="logoAssetId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload 
                        value={field.value} 
                        onChange={field.onChange} 
                        type="game_logo" 
                        label="Logo du Jeu"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={gameForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={actionLoading}>Créer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Assigner Utilisateur */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un accès Studio</DialogTitle>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Utilisateur</FormLabel>
                    <FormControl>
                      <Combobox
                        items={(allUsersData?.users || []).map((u: any) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                        value={field.value}
                        onSelect={field.onChange}
                        placeholder="Chercher un utilisateur..."
                        emptyText="Aucun utilisateur trouvé."
                        modal
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value="member">Membre</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={actionLoading}>Assigner</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
