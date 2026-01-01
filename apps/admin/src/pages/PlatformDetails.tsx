import { useState, useMemo, useEffect } from 'react'
import { useRoute, useLocation } from "wouter"
import { usePlatform, usePlatformOnboarding } from '../hooks/use-platforms'
import { mutate } from 'swr'
import { api, devHeaders } from '../lib/api'
import { Button } from '@repo/ui/components/ui/button'
import { DataTable } from '../components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
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
import { Switch } from '@repo/ui/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Share2, ArrowLeft, Plus, Pencil, Trash2, Settings2, Code2, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteConfirmDialog } from '../components/delete-confirm-dialog'

const CDN_URL = import.meta.env.VITE_CDN_URL ?? 'https://cdn.lovelace.gg'

const platformSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
  configSchema: z.string().default(""),
})

const stepSchema = z.object({
  slug: z.string().min(1, "Slug requis"),
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  order: z.number().default(0),
  dependsOn: z.string().optional(),
  executorType: z.enum(["temporal_activity", "manual"]),
  executorConfig: z.string().default("{}"),
})

export function PlatformDetails() {
  const [, params] = useRoute("/platforms/:id")
  const [, setLocation] = useLocation()
  const platformId = params?.id
  
  const { data: platformData, isLoading: platformLoading } = usePlatform(platformId)
  const { data: stepsData, isLoading: stepsLoading } = usePlatformOnboarding(platformId)
  
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false)
  const [isPlatformDialogOpen, setIsPlatformDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<any>(null)
  const [stepToDelete, setStepToDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const platformForm = useForm<z.infer<typeof platformSchema>>({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      name: "",
      color: "#000000",
      isActive: true,
      configSchema: ""
    },
    values: platformData?.platform ? {
      name: platformData.platform.name,
      color: platformData.platform.color || "#000000",
      isActive: platformData.platform.isActive,
      configSchema: (platformData.platform.configSchema || []).join(', ')
    } : undefined
  })

  const stepForm = useForm<z.infer<typeof stepSchema>>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      order: 0,
      dependsOn: "",
      executorType: "manual",
      executorConfig: "{}"
    }
  })

  const selectedExecutor = stepForm.watch("executorType");

  // Force reset when data is loaded
  useEffect(() => {
    if (platformData?.platform && isPlatformDialogOpen) {
      platformForm.reset({
        name: platformData.platform.name,
        color: platformData.platform.color || "#000000",
        isActive: platformData.platform.isActive,
        configSchema: (platformData.platform.configSchema || []).join(', ')
      })
    }
  }, [platformData, isPlatformDialogOpen, platformForm])

  const helpText = useMemo(() => {
    switch (selectedExecutor) {
      case 'temporal_activity':
        return {
          title: "Activité Temporal",
          example: JSON.stringify({
            activityName: "createOnboardingRequest",
            params: {
              type: "UPLOAD",
              config: { label: "Upload CSV Steam", accept: ".csv" }
            }
          }, null, 2),
          desc: "Exécute une activité définie dans le Worker Temporal."
        };
      case 'manual':
        return {
          title: "Action Manuelle",
          example: "{}",
          desc: "Simple case à cocher pour l'admin."
        };
      default:
        return null;
    }
  }, [selectedExecutor]);

  const onPlatformSubmit = async (values: z.infer<typeof platformSchema>) => {
    if (!platformId) return
    setActionLoading(true)
    try {
      const schemaArray = values.configSchema
        ? values.configSchema.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : []

      const res = await api.admin.platforms[':id'].$put({
        param: { id: platformId },
        json: {
          ...values,
          configSchema: schemaArray
        } as any,
        header: devHeaders(),
      })
      
      if (!res.ok) throw new Error()
      const updatedData = await res.json()
      
      // Mise à jour locale du cache SWR avec la réponse du serveur
      await mutate(['platform', platformId], updatedData, { revalidate: false })
      
      setIsPlatformDialogOpen(false)
      toast.success("Plateforme mise à jour")
    } catch (e) {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setActionLoading(false)
    }
  }

  const onStepSubmit = async (values: z.infer<typeof stepSchema>) => {
    if (!platformId) return
    setActionLoading(true)
    try {
      let configObj = {}
      try {
        configObj = JSON.parse(values.executorConfig || "{}")
      } catch (e) {
        toast.error("Format JSON invalide")
        setActionLoading(false)
        return
      }

      const dependsOnArray = values.dependsOn 
        ? values.dependsOn.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : []

      await api.admin.platforms[':id']['onboarding-steps'].$post({
        param: { id: platformId },
        json: { 
          ...values,
          executorConfig: configObj,
          dependsOn: dependsOnArray
        },
        header: devHeaders(),
      })
      
      await mutate(['platform-onboarding', platformId])
      setIsStepDialogOpen(false)
      stepForm.reset()
      toast.success("Étape enregistrée")
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setActionLoading(false)
    }
  }

  const onRemoveStep = async () => {
    if (!stepToDelete) return
    setActionLoading(true)
    try {
      await api.admin.platforms['onboarding-steps'][':slug'].$delete({
        param: { slug: stepToDelete },
        header: devHeaders(),
      })
      await mutate(['platform-onboarding', platformId])
      toast.success("Étape supprimée")
      setIsDeleteDialogOpen(false)
    } catch (e) {
      toast.error("Erreur")
    } finally {
      setActionLoading(false)
      setStepToDelete(null)
    }
  }

  const onEditStep = (step: any) => {
    setEditingStep(step)
    stepForm.reset({
      slug: step.slug,
      title: step.title,
      description: step.description || "",
      order: step.order,
      dependsOn: (step.dependsOn || []).join(', '),
      executorType: step.executorType,
      executorConfig: JSON.stringify(step.executorConfig, null, 2)
    })
    setIsStepDialogOpen(true)
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: "order", header: "#", cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("order")}</span> },
    {
      accessorKey: "title",
      header: "Étape",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.getValue("title")}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.slug}</span>
        </div>
      )
    },
    { accessorKey: "executorType", header: "Moteur", cell: ({ row }) => <span className="text-[10px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{row.getValue("executorType")}</span> },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEditStep(row.original)}><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
            setStepToDelete(row.original.slug)
            setIsDeleteDialogOpen(true)
          }}><Trash2 className="w-4 h-4" /></Button>
        </div>
      )
    }
  ]

  if (platformLoading) return <div className="p-8 text-center text-muted-foreground italic text-sm">Chargement...</div>
  if (!platformData?.platform) return <div className="p-8 text-center text-destructive font-medium">Plateforme non trouvée</div>

  const platform = platformData.platform

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/platforms")} className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            {platform.logoAssetId ? (
              <img 
                src={`${CDN_URL}/assets/${platform.logoAssetId}/48.webp`} 
                className="w-10 h-10 object-contain" 
                alt="" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: `${platform.color}20`, color: platform.color }}>
                <Share2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{platform.name}</h1>
              <p className="text-xs text-muted-foreground font-mono">/{platform.slug}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="onboarding" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="onboarding" className="rounded-md">Catalogue Onboarding</TabsTrigger>
          <TabsTrigger value="config" className="rounded-md">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="space-y-4">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
            <div>
              <h2 className="text-lg font-bold">Étapes d'automatisation</h2>
              <p className="text-sm text-muted-foreground">Proposées à chaque jeu utilisant {platform.name}.</p>
            </div>
            <Button size="sm" onClick={() => { setEditingStep(null); stepForm.reset(); setIsStepDialogOpen(true); }} className="rounded-full px-6">
              <Plus className="w-4 h-4 mr-2" /> Ajouter une étape
            </Button>
          </div>
          
          {stepsLoading ? <div className="p-8 text-center text-muted-foreground italic text-sm">Chargement...</div> :
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <DataTable columns={columns} data={stepsData?.steps || []} />
            </div>}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card className="rounded-xl shadow-sm border">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
              <CardTitle className="text-lg">Détails Techniques</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsPlatformDialogOpen(true)} className="rounded-full">
                <Pencil className="w-4 h-4 mr-2" /> Modifier
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Slug Unique</label>
                  <p className="mt-1 font-mono text-sm font-medium">{platform.slug}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Couleur</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: platform.color || '#000000' }} />
                    <span className="font-mono text-sm uppercase font-medium">{platform.color || '#000000'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Statut</label>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${platform.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {platform.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Champs de configuration requis</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {platform.configSchema && platform.configSchema.length > 0 ? (
                      platform.configSchema.map((field: string) => (
                        <span key={field} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md font-mono text-xs font-bold">
                          {field}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Aucun champ requis configuré.</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID Interne</label>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{platform.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="px-8 py-6 border-b bg-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {editingStep ? "Modifier l'étape" : "Ajouter une étape pour " + platform.name}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...stepForm}>
            <form onSubmit={stepForm.handleSubmit(onStepSubmit)} className="flex-1 overflow-y-auto p-8 pt-6 space-y-10 bg-slate-50/20">
              <div className="space-y-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 border-b pb-2">Informations générales</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField control={stepForm.control} name="title" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Titre</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={stepForm.control} name="order" render={({ field }) => (
                    <FormItem><FormLabel>Ordre</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="bg-white" /></FormControl></FormItem>
                  )} />
                  <FormField control={stepForm.control} name="executorType" render={({ field }) => (
                    <FormItem><FormLabel className="font-bold text-primary">Moteur</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-white border-primary/20"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="temporal_activity">Activité Temporal (Worker)</SelectItem>
                          <SelectItem value="manual">Manuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={stepForm.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug unique</FormLabel><FormControl><Input {...field} disabled={!!editingStep} className="bg-muted/30 font-mono" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={stepForm.control} name="dependsOn" render={({ field }) => (
                    <FormItem><FormLabel>Dépendance (slugs)</FormLabel><FormControl><Input {...field} placeholder="step-prev-1, step-prev-2" className="bg-white" /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={stepForm.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Aide pour l'utilisateur</FormLabel><FormControl><Textarea {...field} rows={2} className="bg-white" /></FormControl></FormItem>
                )} />
              </div>

              <div className="space-y-6 pb-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 border-b pb-2">Configuration technique</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <FormField control={stepForm.control} name="executorConfig" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center gap-2"><Code2 className="w-4 h-4 text-blue-600" /> Config JSON</FormLabel>
                      <FormControl>
                        <Textarea className="font-mono text-xs h-[300px] bg-slate-900 text-blue-50 border-none rounded-xl p-6 shadow-inner focus-visible:ring-1 focus-visible:ring-blue-500/50" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />

                  <div className="space-y-3">
                    <label className="text-sm font-medium leading-none flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-600" /> Aide & Exemples
                    </label>
                    {helpText ? (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 space-y-4 shadow-sm">
                        <div className="font-bold text-xs uppercase text-emerald-700 tracking-wider">Exemple {helpText.title}</div>
                        <pre className="font-mono text-[11px] leading-relaxed whitespace-pre overflow-auto max-h-60 border border-emerald-200/50 bg-white p-5 rounded-lg text-emerald-900 shadow-sm">
                          {helpText.example}
                        </pre>
                        <p className="text-[11px] text-emerald-800/80 leading-relaxed font-medium bg-emerald-100/30 p-3 rounded-md border border-emerald-100/50 italic">
                          {helpText.desc}
                        </p>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground text-sm italic bg-white/50">
                        Choisissez un moteur pour afficher les instructions.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </Form>

          <DialogFooter className="px-8 py-6 border-t bg-white shrink-0">
            <Button variant="ghost" onClick={() => setIsStepDialogOpen(false)} disabled={actionLoading} className="rounded-full">Annuler</Button>
            <Button type="submit" onClick={stepForm.handleSubmit(onStepSubmit)} disabled={actionLoading} className="px-12 rounded-full font-bold shadow-lg shadow-primary/20">
              {actionLoading ? "Enregistrement..." : "Valider l'étape"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPlatformDialogOpen} onOpenChange={setIsPlatformDialogOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="px-8 py-6 border-b bg-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" /> Modifier la Plateforme
            </DialogTitle>
          </DialogHeader>
          <Form {...platformForm}>
            <form onSubmit={platformForm.handleSubmit(onPlatformSubmit)} className="p-8 space-y-6 bg-slate-50/20">
              <FormField control={platformForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel className="font-semibold">Nom de la plateforme</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={platformForm.control} name="color" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Couleur</FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input {...field} placeholder="#000000" className="font-mono bg-white" /></FormControl>
                      <input type="color" value={field.value} onChange={(e) => field.onChange(e.target.value)} className="w-10 h-10 p-1 rounded-md border cursor-pointer" />
                    </div>
                  </FormItem>
                )} />
                <FormField control={platformForm.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-white shadow-sm self-end h-[40px]">
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Active</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <FormField control={platformForm.control} name="configSchema" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Champs de configuration requis</FormLabel>
                  <FormControl><Input {...field} placeholder="ex: appId, guildId" className="bg-white" /></FormControl>
                  <p className="text-[10px] text-muted-foreground italic">Séparez par des virgules. Utilisé par Temporal pour valider l'onboarding.</p>
                </FormItem>
              )} />

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setIsPlatformDialogOpen(false)} disabled={actionLoading} className="rounded-full">Annuler</Button>
                <Button type="submit" disabled={actionLoading} className="px-10 rounded-full font-bold">Enregistrer</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={onRemoveStep}
        isLoading={actionLoading}
        title="Supprimer l'étape"
        description={`Voulez-vous vraiment supprimer l'étape "${stepToDelete}" ? Elle sera retirée de tous les jeux utilisant cette plateforme.`}
      />
    </div>
  )
}