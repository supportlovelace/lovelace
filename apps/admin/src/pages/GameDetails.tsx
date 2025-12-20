import { useState, useEffect } from 'react'
import { useRoute, useLocation } from "wouter"
import { useGame, useGameUsers } from '../hooks/use-games'
import { usePlatforms, useGamePlatforms } from '../hooks/use-platforms'
import { useUsers } from '../hooks/use-users'
import { useDiscordGuilds } from '../hooks/use-discord'
import { useGameOnboarding, triggerOnboardingStep } from '../hooks/use-onboarding'
import { mutate } from 'swr'
import { api, devHeaders } from '../lib/api'
import { Button } from '@repo/ui/components/ui/button'
import { DataTable } from '../components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
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
import { Gamepad2, ShieldCheck, ArrowLeft, Building2, Pencil, Trash2, X, Share2, Plus, Settings2, Lock, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ImageUpload } from '../components/image-upload'
import { CsvImportDialog } from '../components/csv-import-dialog'
import { DynamicFormDialog } from '../components/dynamic-form-dialog'

const gameSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  logoAssetId: z.string().nullable().optional(),
})

const userAssignSchema = z.object({
  userId: z.string().min(1, "L'utilisateur est requis"),
  role: z.enum(["admin", "member"]),
})

const integrationSchema = z.object({
  platformId: z.string().min(1, "La plateforme est requise"),
  status: z.string().default("pending"),
  config: z.string().optional(), // On va parser le JSON
})

const CDN_URL = import.meta.env.VITE_CDN_URL ?? 'https://cdn.lovelace.gg'

export function GameDetails() {
  const [, params] = useRoute("/games/:id")
  const [, setLocation] = useLocation()
  const gameId = params?.id
  
  const { data: gameData, isLoading: gameLoading } = useGame(gameId)
  const { data: usersRelationsData, isLoading: usersLoading } = useGameUsers(gameId)
  const { data: integrationsData, isLoading: integrationsLoading } = useGamePlatforms(gameId)
  const { data: onboardingData, isLoading: onboardingLoading } = useGameOnboarding(gameId)
  const { data: allPlatformsData } = usePlatforms()
  const { data: allUsersData } = useUsers()
  const { data: discordGuildsData } = useDiscordGuilds()
  
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [selectedStep, setSelectedStep] = useState<any>(null)
  const [editingIntegration, setEditingIntegration] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const gameForm = useForm<z.infer<typeof gameSchema>>({
    resolver: zodResolver(gameSchema),
    defaultValues: { name: "", description: "", logoAssetId: null },
    values: gameData?.game ? {
      name: gameData.game.name,
      description: gameData.game.description || "",
      logoAssetId: gameData.game.logoAssetId || null,
    } : undefined
  })

  const userForm = useForm<z.infer<typeof userAssignSchema>>({
    resolver: zodResolver(userAssignSchema),
    defaultValues: { userId: "", role: "member" }
  })

  const integrationForm = useForm<z.infer<typeof integrationSchema>>({
    resolver: zodResolver(integrationSchema),
    defaultValues: { platformId: "", status: "pending", config: "{}" }
  })

  const selectedPlatformId = integrationForm.watch("platformId");
  const selectedPlatform = allPlatformsData?.platforms?.find((p: any) => p.id === selectedPlatformId);
  const isDiscord = selectedPlatform?.slug === 'discord';

  const onUpdateGame = async (values: z.infer<typeof gameSchema>) => {
    if (!gameId) return
    setActionLoading(true)
    try {
      await api.admin.games[':id'].$put({
        param: { id: gameId },
        json: values,
        header: devHeaders(),
      })
      await mutate(['game', gameId])
      setIsEditDialogOpen(false)
      toast.success("Jeu mis à jour")
    } catch (e) {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setActionLoading(false)
    }
  }

  const onDeleteGame = async () => {
    if (!gameId) return
    setActionLoading(true)
    try {
      await api.admin.games[':id'].$delete({
        param: { id: gameId },
        header: devHeaders(),
      })
      toast.success("Jeu supprimé")
      setLocation(gameData?.game?.studioId ? `/studios/${gameData.game.studioId}` : '/publishers')
    } catch (e) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setActionLoading(false)
    }
  }

  const onUserSubmit = async (values: z.infer<typeof userAssignSchema>) => {
    if (!gameId) return
    setActionLoading(true)
    try {
      await api.admin.games[':id'].users.$post({
        param: { id: gameId },
        json: { ...values, action: "add" },
        header: devHeaders(),
      })
      await mutate(['game-users', gameId])
      setIsUserDialogOpen(false)
      userForm.reset()
      toast.success("Accès assigné")
    } catch (e) {
      toast.error("Erreur lors de l'assignation")
    } finally {
      setActionLoading(false)
    }
  }

  const onRemoveUser = async (userId: string, role: 'admin'|'member') => {
    if (!gameId) return
    if (!confirm("Voulez-vous vraiment retirer cet accès ?")) return
    try {
      await api.admin.games[':id'].users.$post({
        param: { id: gameId },
        json: { userId, role, action: "remove" },
        header: devHeaders(),
      })
      await mutate(['game-users', gameId])
      toast.success("Accès retiré")
    } catch (e) {
      toast.error("Erreur lors du retrait")
    }
  }

  const onIntegrationSubmit = async (values: z.infer<typeof integrationSchema>) => {
    if (!gameId) return
    setActionLoading(true)
    try {
      let configObj = {}
      try {
        configObj = JSON.parse(values.config || "{}")
      } catch (e) {
        toast.error("Format JSON invalide dans la configuration")
        setActionLoading(false)
        return
      }

      await api.admin.games[':id'].platforms.$post({
        param: { id: gameId },
        json: { 
          platformId: values.platformId,
          config: configObj,
          status: values.status
        },
        header: devHeaders(),
      })
      await mutate(['game-platforms', gameId])
      setIsIntegrationDialogOpen(false)
      integrationForm.reset()
      toast.success("Intégration enregistrée")
    } catch (e) {
      toast.error("Erreur lors de l'intégration")
    } finally {
      setActionLoading(false)
    }
  }

  const onRemoveIntegration = async (integrationId: string) => {
    if (!gameId) return
    if (!confirm("Supprimer cette intégration ?")) return
    try {
      await api.admin.games[':id'].platforms[':integrationId'].$delete({
        param: { id: gameId, integrationId },
        header: devHeaders(),
      })
      await mutate(['game-platforms', gameId])
      toast.success("Intégration supprimée")
    } catch (e) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const onEditIntegration = (integration: any) => {
    setEditingIntegration(integration)
    integrationForm.reset({
      platformId: integration.platformId,
      status: integration.status,
      config: JSON.stringify(integration.config, null, 2)
    })
    setIsIntegrationDialogOpen(true)
  }

  const onTriggerStep = async (step: any) => {
    if (!gameId) return

    if (step.executorType === 'csv_import' || step.executorConfig?.requiresCsv) {
      setSelectedStep(step)
      setIsImportDialogOpen(true)
      return
    }

    if (step.executorType === 'form') {
      setSelectedStep(step)
      setIsFormDialogOpen(true)
      return
    }

    try {
      await triggerOnboardingStep(gameId, step.slug)
      toast.success("Action lancée avec succès")
    } catch (e) {
      toast.error("Erreur lors du lancement")
    }
  }

  // --- Columns ---
  const userColumns: ColumnDef<any>[] = [
    { accessorKey: "user.name", header: "Nom", cell: ({ row }) => row.original.user?.name || "Inconnu" },
    { accessorKey: "role", header: "Rôle", cell: ({ row }) => <span className="capitalize">{row.getValue("role")}</span> },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onRemoveUser(row.original.userId, row.original.role)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const integrationColumns: ColumnDef<any>[] = [
    {
      accessorKey: "platformName",
      header: "Plateforme",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.platformLogoAssetId ? (
            <img 
              src={`${CDN_URL}/assets/${row.original.platformLogoAssetId}/48.webp`} 
              className="w-5 h-5 object-contain" 
              alt="" 
            />
          ) : (
            <div className="w-5 h-5 bg-gray-50 rounded flex items-center justify-center">
              <Share2 className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <span className="font-medium">{row.getValue("platformName")}</span>
        </div>
      )
    },
    {
      accessorKey: "config",
      header: "Configuration",
      cell: ({ row }) => {
        const config = row.original.config || {};
        return (
          <div className="flex flex-wrap gap-1">
            {Object.entries(config).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[10px]">
                <span className="font-bold text-slate-500 uppercase tracking-tighter">{key}:</span>
                <span className="font-mono text-blue-600 truncate max-w-[150px]">{String(value)}</span>
              </div>
            ))}
            {Object.keys(config).length === 0 && <span className="text-[10px] text-slate-400 italic">Aucune</span>}
          </div>
        );
      }
    },
    { accessorKey: "status", header: "Statut", cell: ({ row }) => <span className="text-xs uppercase font-bold text-slate-500">{row.getValue("status")}</span> },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEditIntegration(row.original)}>
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onRemoveIntegration(row.original.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const onboardingColumns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "Étape",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {row.original.isLocked && <Lock className="w-3 h-3 text-gray-400" />}
            <span className="font-semibold text-sm">{row.getValue("title")}</span>
          </div>
          <span className="text-[11px] text-gray-500 line-clamp-1">{row.original.description}</span>
        </div>
      )
    },
    {
      accessorKey: "platformName",
      header: "Source",
      cell: ({ row }) => {
        const name = row.getValue("platformName") as string;
        const color = row.original.platformColor;
        
        return (
          <div className="flex items-center">
            {name ? (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider shadow-sm"
                style={{
                  backgroundColor: `${color}10`,
                  borderColor: `${color}30`,
                  color: color || '#666'
                }}
              >
                <Share2 className="w-3 h-3" />
                {name}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <Settings2 className="w-3 h-3" />
                Général
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const isLocked = row.original.isLocked
        
        if (isLocked) {
          return (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-400 border border-slate-200">
              <Lock className="w-3 h-3" />
              Verrouillé
            </div>
          )
        }

        switch (status) {
          case 'completed':
            return (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Terminé
              </div>
            );
          case 'running':
            return (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">
                <Clock className="w-3 h-3" />
                En cours
              </div>
            );
          case 'error':
            return (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-red-100 text-red-700 border border-red-200">
                <AlertCircle className="w-3 h-3" />
                Erreur
              </div>
            );
          default:
            return (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-600 border border-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                En attente
              </div>
            );
        }
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const isCompleted = status === 'completed';
        const isLocked = row.original.isLocked;

        return (
          <div className="flex justify-end px-2">
            <Button 
              variant={isCompleted ? "ghost" : "outline"} 
              size="sm" 
              className="h-8 text-xs bg-white"
              disabled={status === 'running' || isLocked || isCompleted}
              onClick={() => onTriggerStep(row.original)}
            >
              {isCompleted ? 'Terminé' : (row.original.executorType === 'csv_import' || row.original.executorConfig?.requiresCsv ? 'Importer' : 'Lancer')}
            </Button>
          </div>
        )
      }
    }
  ]

  if (gameLoading) return <div className="p-8 text-center">Chargement...</div>
  if (!gameData?.game) return <div className="p-8 text-center text-red-600">Jeu non trouvé</div>

  const game = gameData.game

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/studios/${game.studioId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-4">
            {game.logoAssetId ? (
              <img 
                src={`${CDN_URL}/assets/${game.logoAssetId}/192.webp`} 
                className="w-12 h-12 rounded-lg object-cover border" 
                alt="" 
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-green-50 border flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-green-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-green-600" />
                <h1 className="text-3xl font-bold tracking-tight">{game.name}</h1>
              </div>
              <p className="text-gray-500">Studio: {game.studioName}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Modifier
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="infos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding & Setup</TabsTrigger>
          <TabsTrigger value="integrations">Intégrations ({integrationsData?.integrations?.length || 0})</TabsTrigger>
          <TabsTrigger value="users">Membres ({usersRelationsData?.userRelations?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Configuration du Jeu</h2>
            <div className="text-xs text-gray-500">
              Les étapes s'activent en fonction de vos plateformes connectées.
            </div>
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            {onboardingLoading ? <div className="p-8 text-center text-gray-500">Chargement...</div> :
              <DataTable 
                columns={onboardingColumns} 
                data={onboardingData?.onboarding || []} 
                getRowStyle={(row: any) => {
                  const color = row.platformColor;
                  const isCompleted = row.status === 'completed';
                  const isLocked = row.isLocked;
                  
                  return {
                    backgroundColor: color ? `${color}10` : 'transparent',
                    opacity: isCompleted || isLocked ? 0.5 : 1,
                    filter: isCompleted ? 'grayscale(0.5)' : 'none',
                    borderLeft: color ? `4px solid ${color}` : 'none'
                  }
                }}
              />}
          </div>
        </TabsContent>

        <TabsContent value="infos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Détails du Jeu</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1">{game.description || "Aucune description."}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Studio</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    <span>{game.studioName}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ID Unique</label>
                  <p className="mt-1 font-mono text-xs">{game.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Plateformes connectées</h2>
            <Button size="sm" onClick={() => { setEditingIntegration(null); integrationForm.reset(); setIsIntegrationDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter une intégration
            </Button>
          </div>
          {integrationsLoading ? <div className="p-8 text-center text-gray-500">Chargement...</div> :
            <DataTable columns={integrationColumns} data={integrationsData?.integrations || []} />}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des membres Jeu</h2>
            <Button size="sm" variant="outline" onClick={() => setIsUserDialogOpen(true)}>
              <ShieldCheck className="w-4 h-4 mr-2" /> Assigner
            </Button>
          </div>
          {usersLoading ? <div className="p-8 text-center text-gray-500">Chargement...</div> :
            <DataTable columns={userColumns} data={usersRelationsData?.userRelations || []} />}
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier le Jeu</DialogTitle></DialogHeader>
          <Form {...gameForm}>
            <form onSubmit={gameForm.handleSubmit(onUpdateGame)} className="space-y-4">
              <FormField control={gameForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={gameForm.control} name="logoAssetId" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload value={field.value} onChange={field.onChange} type="game_logo" label="Logo du Jeu" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={gameForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter><Button type="submit" disabled={actionLoading}>Enregistrer</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer le Jeu ?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={onDeleteGame} disabled={actionLoading}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un accès Jeu</DialogTitle>
            <DialogDescription>Donnez accès à ce jeu à un utilisateur existant.</DialogDescription>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
              <FormField control={userForm.control} name="userId" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Utilisateur</FormLabel>
                  <FormControl>
                    <Combobox items={(allUsersData?.users || []).map((u: any) => ({ value: u.id, label: `${u.name} (${u.email})` }))} value={field.value} onSelect={field.onChange} placeholder="Chercher..." modal />
                  </FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField control={userForm.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Rôle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent position="popper"><SelectItem value="member">Membre</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                  </Select>
                </FormItem>
              )} />
              <DialogFooter><Button type="submit" disabled={actionLoading}>Assigner</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isIntegrationDialogOpen} onOpenChange={setIsIntegrationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIntegration ? "Modifier l'intégration" : "Ajouter une intégration"}</DialogTitle>
            <DialogDescription>Configurez les paramètres de connexion pour cette plateforme.</DialogDescription>
          </DialogHeader>
          <Form {...integrationForm}>
            <form onSubmit={integrationForm.handleSubmit(onIntegrationSubmit)} className="space-y-4">
              <FormField control={integrationForm.control} name="platformId" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Plateforme</FormLabel>
                  <FormControl>
                    <Combobox items={(allPlatformsData?.platforms || []).map((p: any) => ({ value: p.id, label: p.name }))} value={field.value} onSelect={field.onChange} placeholder="Choisir une plateforme..." modal />
                  </FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField control={integrationForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent position="popper">
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="connected">Connecté</SelectItem>
                      <SelectItem value="error">Erreur</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              {isDiscord ? (
                <div className="space-y-4">
                  <FormField
                    control={integrationForm.control}
                    name="config"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Serveur Discord (Guild)</FormLabel>
                        <FormControl>
                          <Combobox 
                            items={(discordGuildsData?.guilds || []).map((g: any) => ({ 
                              value: g.id, 
                              label: g.name 
                            }))} 
                            value={(() => {
                              try {
                                const config = JSON.parse(field.value || "{}");
                                return config.guildId || "";
                              } catch { return ""; }
                            })()}
                            onSelect={(guildId) => {
                              integrationForm.setValue("config", JSON.stringify({ guildId }, null, 2));
                            }}
                            placeholder="Choisir un serveur où le bot est présent..." 
                            modal 
                          />
                        </FormControl>
                        <p className="text-[10px] text-muted-foreground italic">
                          Seuls les serveurs où le bot Lovelace a été invité apparaissent ici.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField control={integrationForm.control} name="config" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase text-muted-foreground">Aperçu JSON</FormLabel>
                      <FormControl><Textarea className="font-mono text-[10px] h-20 bg-slate-50" {...field} readOnly /></FormControl>
                    </FormItem>
                  )} />
                </div>
              ) : (
                <FormField control={integrationForm.control} name="config" render={({ field }) => (
                  <FormItem><FormLabel>Configuration (JSON)</FormLabel>
                    <FormControl><Textarea className="font-mono text-xs h-32" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <DialogFooter><Button type="submit" disabled={actionLoading}>Enregistrer</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedStep && (
        <CsvImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          gameId={gameId!}
          stepSlug={selectedStep.slug}
          targetTable={selectedStep.executorConfig?.targetTable || 'unknown'}
          expectedFields={selectedStep.executorConfig?.expectedFields || []}
          onSuccess={() => mutate(['game-onboarding', gameId])}
        />
      )}

      {selectedStep && (
        <DynamicFormDialog
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          gameId={gameId!}
          step={selectedStep}
          onSuccess={() => mutate(['game-onboarding', gameId])}
        />
      )}
    </div>
  )
}