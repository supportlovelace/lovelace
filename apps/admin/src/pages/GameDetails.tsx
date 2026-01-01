import { useState, useEffect } from 'react'
import { useRoute, useLocation } from "wouter"
import { useGame, useGameUsers } from '../hooks/use-games'
import { usePlatforms, useGamePlatforms } from '../hooks/use-platforms'
import { useUsers } from '../hooks/use-users'
import { useDiscordGuilds } from '../hooks/use-discord'
import { useGameOnboarding, triggerOnboardingStep } from '../hooks/use-onboarding'
import { useOnboardingRequests, submitOnboardingRequest } from '../hooks/use-onboarding-requests'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
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
import { Gamepad2, ShieldCheck, ArrowLeft, Building2, Pencil, Trash2, X, Share2, Plus, Settings2, Lock, CheckCircle2, Clock, AlertCircle, Zap, ChevronRight, XCircle, Activity, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { ImageUpload } from '../components/image-upload'
import { CsvImportDialog } from '../components/csv-import-dialog'
import { DynamicFormDialog } from '../components/dynamic-form-dialog'
import { OnboardingInPageReview } from '../components/onboarding-in-page-review'
import { OnboardingConfigForm } from '../components/onboarding-config-form'

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
const TEMPORAL_UI_URL = import.meta.env.VITE_TEMPORAL_UI_URL ?? 'http://localhost:8233';
const KESTRA_UI_URL = import.meta.env.VITE_KESTRA_UI_URL ?? 'http://localhost:8080';

export function GameDetails() {
  const [, params] = useRoute("/games/:id")
  const [, setLocation] = useLocation()
  const gameId = params?.id
  
  const { data: gameData, isLoading: gameLoading } = useGame(gameId)
  const { data: usersRelationsData, isLoading: usersLoading } = useGameUsers(gameId)
  const { data: integrationsData, isLoading: integrationsLoading } = useGamePlatforms(gameId)
  const { data: onboardingData, isLoading: onboardingLoading } = useGameOnboarding(gameId)
  const { data: requestsData } = useOnboardingRequests(gameId)
  const { data: allPlatformsData } = usePlatforms()
  const { data: allUsersData } = useUsers()
  const { data: discordGuildsData } = useDiscordGuilds()
  
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [selectedStep, setSelectedStep] = useState<any>(null)
  const [detailsStep, setDetailsStep] = useState<any>(null)
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
      const res = await api.admin.games[':id'].$put({
        param: { id: gameId },
        json: values,
        header: devHeaders(),
      })
      if (!res.ok) throw new Error()
      const updatedData = await res.json()
      
      await mutate(['game', gameId], updatedData, { revalidate: false })
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

  const onStartFullOnboarding = async () => {
    if (!gameId) return
    setActionLoading(true)
    try {
      await api.admin.onboarding[':gameId'].start.$post({
        param: { gameId },
        header: devHeaders(),
      })
      toast.success("Onboarding démarré")
      await mutate(['game-onboarding', gameId])
    } catch (e) {
      toast.error("Erreur lors du lancement")
    } finally {
      setActionLoading(false)
    }
  }

  const onCancelOnboarding = async () => {
    if (!gameId) return
    setActionLoading(true)
    try {
      await api.admin.onboarding[':gameId'].cancel.$post({
        param: { gameId },
        header: devHeaders(),
      })
      toast.success("Annulation demandée")
      await mutate(['game-onboarding', gameId])
    } catch (e) {
      toast.error("Erreur")
    } finally {
      setActionLoading(false)
    }
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
      cell: ({ row }) => {
        const isDimmed = ['completed', 'skipped', 'cancelled'].includes(row.original.status) || row.original.isLocked;
        return (
          <div className={`flex flex-col ${isDimmed ? "opacity-70 grayscale-[0.5]" : ""}`}>
            <div className="flex items-center gap-2">
              {row.original.isLocked && <Lock className="w-3 h-3 text-gray-400" />}
              <span className="font-semibold text-sm">{row.getValue("title")}</span>
            </div>
            <span className="text-[11px] text-gray-500 line-clamp-1">{row.original.description}</span>
          </div>
        )
      }
    },
    {
      accessorKey: "platformName",
      header: "Source",
      cell: ({ row }) => {
        const isDimmed = ['completed', 'skipped', 'cancelled'].includes(row.original.status) || row.original.isLocked;
        const name = row.getValue("platformName") as string;
        const color = row.original.platformColor;
        
        return (
          <div className={`flex items-center ${isDimmed ? "opacity-70 grayscale-[0.5]" : ""}`}>
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
        const status = row.original.status as string
        const isLocked = row.original.isLocked
        
        if (isLocked) {
          return (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-400 border border-slate-200 shadow-sm">
              <Lock className="w-3 h-3" />
              Verrouillé
            </div>
          )
        }

        switch (status) {
          case 'completed':
            return (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                Terminé
              </div>
            );
          case 'running':
            return (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-blue-100 text-blue-700 border border-blue-200 animate-pulse shadow-sm">
                <Clock className="w-3 h-3" />
                En cours
              </div>
            );
          case 'error':
            return (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-red-100 text-red-700 border border-red-200 shadow-sm">
                <AlertCircle className="w-3 h-3" />
                Erreur
              </div>
            );
          case 'skipped':
            return (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-400 border border-slate-200 shadow-sm">
                <X className="w-3 h-3" />
                Passée
              </div>
            );
          case 'cancelled':
            return (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-red-100 text-red-700 border border-red-200 shadow-sm">
                <XCircle className="w-3 h-3" />
                Annulé
              </div>
            );
          default:
            return (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                En attente
              </div>
            );
        }
      }
    },
    {
      accessorKey: "lastRunAt",
      header: "Dernier run",
      cell: ({ row }) => {
        const isDimmed = ['completed', 'skipped', 'cancelled'].includes(row.original.status) || row.original.isLocked;
        const val = row.getValue("lastRunAt") as string;
        if (!val) return <span className={`text-slate-300 ${isDimmed ? "opacity-70" : ""}`}>-</span>;
        return (
          <div className={`flex items-center gap-1.5 text-[10px] font-mono text-slate-500 ${isDimmed ? "opacity-70 grayscale-[0.5]" : ""}`}>
            <Clock className="w-3 h-3" />
            {new Date(val).toLocaleString()}
          </div>
        );
      }
    },
    {
      accessorKey: "updatedAt",
      header: "Mis à jour",
      cell: ({ row }) => {
        const isDimmed = ['completed', 'skipped', 'cancelled'].includes(row.original.status) || row.original.isLocked;
        const val = row.getValue("updatedAt") as string;
        if (!val) return <span className={`text-slate-300 ${isDimmed ? "opacity-70" : ""}`}>-</span>;
        return (
          <div className={`flex items-center gap-1.5 text-[10px] font-mono text-slate-500 ${isDimmed ? "opacity-70 grayscale-[0.5]" : ""}`}>
            <Activity className="w-3 h-3 text-emerald-500" />
            {new Date(val).toLocaleString()}
          </div>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const step = row.original;
        const status = step.status as string;
        const isCompleted = status === 'completed';
        
        // Vérifier si une requête attend ce step (directement ou par plateforme)
        const pendingRequest = requestsData?.requests?.find((r: any) => 
          r.stepSlug === step.slug || 
          (r.type === 'CONFIG_FORM' && r.config.platformSlug === step.platform)
        );

        return (
          <div className="flex justify-end items-center gap-2 px-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setDetailsStep(step)}
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </Button>

            {pendingRequest ? (
              <Button 
                variant="default" 
                size="sm" 
                className="h-8 text-[10px] font-bold uppercase bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm animate-pulse"
                onClick={() => {
                    setSelectedStep(step);
                    if (pendingRequest.type === 'UPLOAD_CSV') setIsImportDialogOpen(true);
                    if (pendingRequest.type === 'CONFIG_FORM') setIsConfigDialogOpen(true);
                }}
              >
                Action Requise
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            ) : (
              <span className="text-[10px] font-bold uppercase text-slate-400 px-3 py-1">
                {isCompleted ? 'Terminé' : (status === 'running' ? 'En cours...' : 'Automatique')}
              </span>
            )}
          </div>
        )
      }
    }
  ]

  if (gameLoading) return <div className="p-8 text-center">Chargement...</div>
  if (!gameData?.game) return <div className="p-8 text-center text-red-600">Jeu non trouvé</div>

  const game = gameData.game
  const gameSlug = game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const workflowId = `onboarding-${gameSlug}-${game.id}`;

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
          {(() => {
            const planRequest = requestsData?.requests?.find((r: any) => r.type === 'REVIEW_PLAN');
            
            if (planRequest) {
              return (
                <OnboardingInPageReview 
                  request={planRequest}
                  onSuccess={() => {
                    mutate(['onboarding-requests', gameId]);
                    mutate(['game-onboarding', gameId]);
                  }}
                />
              );
            }

            return (
              <>
                <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold">Configuration du Jeu</h2>
                    <p className="text-sm text-muted-foreground">Pilotez le processus complet d'onboarding via Temporal.</p>
                  </div>
                  <div className="flex gap-3">
                    {(onboardingData?.onboarding?.some((s: any) => s.status === 'running') || (requestsData?.requests?.length || 0) > 0) ? (
                      <Button 
                        variant="destructive"
                        onClick={onCancelOnboarding}
                        disabled={actionLoading}
                        className="rounded-full px-8 shadow-lg shadow-red-500/20"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Annuler l'Onboarding
                      </Button>
                    ) : (
                      (!onboardingData?.onboarding?.every((s: any) => s.status === 'completed' || s.status === 'skipped')) && (
                        <Button 
                          onClick={onStartFullOnboarding} 
                          disabled={actionLoading}
                          className="rounded-full px-8 shadow-lg shadow-primary/20"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Lancer l'Onboarding
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-lg border overflow-hidden">
                  {onboardingLoading ? <div className="p-8 text-center text-gray-500">Chargement...</div> :
                    <DataTable 
                      columns={onboardingColumns} 
                      data={onboardingData?.onboarding || []} 
                      getRowStyle={(row: any) => {
                        const color = row.platformColor;
                        return {
                          backgroundColor: color ? `${color}10` : 'transparent',
                          borderLeft: color ? `4px solid ${color}` : 'none'
                        }
                      }}
                    />}
                </div>
              </>
            );
          })()}
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
          targetTable={selectedStep.executorConfig?.params?.targetTable || 'unknown'}
          expectedFields={selectedStep.executorConfig?.params?.expectedColumns?.map((c: any) => c.key) || []}
          requestId={requestsData?.requests?.find((r: any) => r.stepSlug === selectedStep.slug)?.id}
          onSuccess={() => {
            mutate(['game-onboarding', gameId]);
            mutate(['onboarding-requests', gameId]);
          }}
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

      {selectedStep && isConfigDialogOpen && (() => {
        const configRequest = requestsData?.requests?.find((r: any) => 
          (r.stepSlug === selectedStep.slug || (r.type === 'CONFIG_FORM' && r.config.platformSlug === selectedStep.platform)) && 
          r.type === 'CONFIG_FORM'
        );
        if (!configRequest) return null;
        return (
          <OnboardingConfigForm
            request={configRequest}
            gameId={gameId!}
            onClose={() => setIsConfigDialogOpen(false)}
            onSuccess={() => {
              setIsConfigDialogOpen(false);
              mutate(['onboarding-requests', gameId]);
              mutate(['game-onboarding', gameId]);
              mutate(['game-platforms', gameId]);
            }}
          />
        );
      })()}
      <Sheet open={!!detailsStep} onOpenChange={(open) => !open && setDetailsStep(null)}>
        <SheetContent className="w-[600px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>{detailsStep?.title}</SheetTitle>
            <SheetDescription>{detailsStep?.description}</SheetDescription>
          </SheetHeader>
          
          {detailsStep && (
            <div className="space-y-6 py-6">
              {/* Status Section */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase">Statut</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm capitalize">{detailsStep.status}</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase">Dernier Run</p>
                  <p className="font-mono text-xs">{detailsStep.lastRunAt ? new Date(detailsStep.lastRunAt).toLocaleString() : '-'}</p>
                </div>
              </div>

              {/* Links Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Liens Externes</h3>
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={`${TEMPORAL_UI_URL}/namespaces/default/workflows/${workflowId}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">T</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Temporal</p>
                      <p className="text-[10px] text-slate-500">Voir l'historique</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>

                  {(() => {
                    const res = detailsStep.result || {};
                    const execConfig = detailsStep.executorConfig?.params || {};
                    const kestraId = res.id; // L'ID d'exécution qu'on a ajouté
                    const namespace = res.namespace || execConfig.namespace || 'lovelace.ingestion';
                    const flowId = res.flowId || execConfig.flowId;

                    if (!flowId) return null;

                    return (
                      <a 
                        href={`${KESTRA_UI_URL}/ui/executions/${namespace}/${flowId}${kestraId ? `/${kestraId}` : ''}`}
                        target="_blank" 
                        rel="noreferrer"
                        title={kestraId ? `Execution ID: ${kestraId}` : undefined}
                        className="flex items-center gap-2 p-3 border rounded-md hover:bg-purple-50 border-purple-100 transition-colors"
                      >
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">K</div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-purple-900">Kestra</p>
                          <p className="text-[10px] text-purple-500">Voir l'exécution</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-purple-400" />
                      </a>
                    );
                  })()}
                </div>
              </div>

              {/* Logs / Result Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Résultat & Logs</h3>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-slate-900 text-slate-50 font-mono text-xs">
                  <pre>{JSON.stringify(detailsStep.result || {}, null, 2)}</pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}