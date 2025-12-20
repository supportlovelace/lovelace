import { useState, useEffect } from 'react'
import { useRoute, useLocation } from "wouter"
import { usePublisher, usePublisherStudios, usePublisherUsers } from '../hooks/use-publishers'
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
import { Building2, Gamepad2, Users, Plus, ShieldCheck, ArrowLeft, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

const studioSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
})

const publisherSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
})

const userAssignSchema = z.object({
  userId: z.string().min(1, "L'utilisateur est requis"),
  role: z.enum(["admin", "member"]),
})

export function PublisherDetails() {
  const [, params] = useRoute("/publishers/:id")
  const [, setLocation] = useLocation()
  const publisherId = params?.id
  
  const { data: pubData, isLoading: pubLoading } = usePublisher(publisherId)
  const { data: studiosData, isLoading: studiosLoading } = usePublisherStudios(publisherId)
  const { data: usersRelationsData, isLoading: usersLoading } = usePublisherUsers(publisherId)
  const { data: allUsersData } = useUsers()
  
  const [isStudioDialogOpen, setIsStudioDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const studioForm = useForm<z.infer<typeof studioSchema>>({
    resolver: zodResolver(studioSchema),
    defaultValues: { name: "", description: "" }
  })

  const publisherForm = useForm<z.infer<typeof publisherSchema>>({
    resolver: zodResolver(publisherSchema),
    defaultValues: { name: "", description: "" }
  })

  const userForm = useForm<z.infer<typeof userAssignSchema>>({
    resolver: zodResolver(userAssignSchema),
    defaultValues: { userId: "", role: "member" }
  })

  useEffect(() => {
    if (pubData?.publisher) {
      publisherForm.reset({
        name: pubData.publisher.name,
        description: pubData.publisher.description || "",
      })
    }
  }, [pubData, publisherForm])

  const onUpdatePublisher = async (values: z.infer<typeof publisherSchema>) => {
    if (!publisherId) return
    setActionLoading(true)
    try {
      await api.admin.publishers[':id'].$put({
        param: { id: publisherId },
        json: values,
        header: devHeaders(),
      })
      await mutate(['publisher', publisherId])
      setIsEditDialogOpen(false)
      toast.success("Publisher mis à jour")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setActionLoading(false)
    }
  }

  const onDeletePublisher = async () => {
    if (!publisherId) return
    setActionLoading(true)
    try {
      await api.admin.publishers[':id'].$delete({
        param: { id: publisherId },
        header: devHeaders(),
      })
      toast.success("Publisher supprimé")
      setLocation("/publishers")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la suppression")
    } finally {
      setActionLoading(false)
    }
  }

  const onStudioSubmit = async (values: z.infer<typeof studioSchema>) => {
    if (!publisherId) return
    setActionLoading(true)
    try {
      await api.admin.studios.$post({
        json: { ...values, publisherId },
        header: devHeaders(),
      })
      await mutate(['publisher-studios', publisherId])
      setIsStudioDialogOpen(false)
      studioForm.reset()
      toast.success("Studio créé")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la création du studio")
    } finally {
      setActionLoading(false)
    }
  }

  const onUserSubmit = async (values: z.infer<typeof userAssignSchema>) => {
    if (!publisherId) return
    setActionLoading(true)
    try {
      await api.admin.publishers[':id'].users.$post({
        param: { id: publisherId },
        json: { ...values, action: "add" },
        header: devHeaders(),
      })
      await mutate(['publisher-users', publisherId])
      setIsUserDialogOpen(false)
      userForm.reset()
      toast.success("Utilisateur assigné")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de l'assignation")
    } finally {
      setActionLoading(false)
    }
  }

  const onRemoveUser = async (userId: string, role: 'admin'|'member') => {
    if (!publisherId) return
    if (!confirm("Voulez-vous vraiment retirer cet accès ?")) return

    try {
      await api.admin.publishers[':id'].users.$post({
        param: { id: publisherId },
        json: { userId, role, action: "remove" },
        header: devHeaders(),
      })
      await mutate(['publisher-users', publisherId])
      toast.success("Accès retiré")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors du retrait de l'accès")
    }
  }

  const studioColumns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Nom du Studio",
      cell: ({ row }) => (
        <div className="flex items-center font-medium">
          <Gamepad2 className="w-4 h-4 mr-2 text-purple-500" />
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
      cell: ({ row }) => row.original.user.name
    },
    {
      accessorKey: "user.email",
      header: "Email",
      cell: ({ row }) => row.original.user.email
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

  if (pubLoading) return <div className="p-8 text-center">Chargement du publisher...</div>
  if (!pubData?.publisher) return <div className="p-8 text-center text-red-600">Publisher non trouvé</div>

  const publisher = pubData.publisher

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/publishers")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight">{publisher.name}</h1>
            </div>
            <p className="text-gray-500">ID: {publisher.id}</p>
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
          <TabsTrigger value="studios">Studios ({studiosData?.studios?.length || 0})</TabsTrigger>
          <TabsTrigger value="users">Membres ({usersRelationsData?.userRelations?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Détails Généraux</CardTitle>
              <CardDescription>Informations de base sur l'éditeur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1">{publisher.description || "Aucune description."}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Créé le</label>
                  <p className="mt-1">{new Date(publisher.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dernière mise à jour</label>
                  <p className="mt-1">{new Date(publisher.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="studios" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Studios rattachés</h2>
            <Button size="sm" onClick={() => setIsStudioDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Studio
            </Button>
          </div>
          
          {studiosLoading ? (
            <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-lg border">Chargement...</div>
          ) : (
            <DataTable 
              columns={studioColumns} 
              data={studiosData?.studios || []} 
              onRowClick={(studio) => setLocation(`/studios/${studio.id}`)}
            />
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des membres</h2>
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

      {/* Dialog Edit Publisher */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Publisher</DialogTitle>
          </DialogHeader>
          <Form {...publisherForm}>
            <form onSubmit={publisherForm.handleSubmit(onUpdatePublisher)} className="space-y-4">
              <FormField
                control={publisherForm.control}
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
                control={publisherForm.control}
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

      {/* Dialog Delete Publisher */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le Publisher ?</DialogTitle>
            <DialogDescription className="text-red-600">
              Attention : Cette action est irréversible. Elle supprimera également tous les studios et jeux associés, ainsi que tous les accès utilisateurs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={onDeletePublisher} disabled={actionLoading}>
              {actionLoading ? "Suppression..." : "Confirmer la suppression"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouveau Studio */}
      <Dialog open={isStudioDialogOpen} onOpenChange={setIsStudioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau Studio</DialogTitle>
            <DialogDescription>Ajouter un studio sous la responsabilité de {publisher.name}.</DialogDescription>
          </DialogHeader>
          <Form {...studioForm}>
            <form onSubmit={studioForm.handleSubmit(onStudioSubmit)} className="space-y-4">
              <FormField
                control={studioForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du Studio</FormLabel>
                    <FormControl><Input placeholder="Ex: Ubisoft Paris" {...field} /></FormControl>
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
            <DialogTitle>Assigner un accès</DialogTitle>
            <DialogDescription>Donner des droits d'accès à {publisher.name} à un utilisateur existant.</DialogDescription>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Membre (Lecture seule / Accès standard)</SelectItem>
                        <SelectItem value="admin">Admin (Gestion totale)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
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