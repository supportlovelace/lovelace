import { useState, useMemo } from 'react'
import { useGlobalOnboarding } from '../hooks/use-onboarding'
import { mutate } from 'swr'
import { api, devHeaders } from '../lib/api'
import { Button } from '@repo/ui/components/ui/button'
import { DataTable } from '../components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Settings2, Plus, Pencil, Trash2, HelpCircle, Code2 } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteConfirmDialog } from '../components/delete-confirm-dialog'

const stepSchema = z.object({
  slug: z.string().min(1, "Slug requis"),
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  order: z.number().default(0),
  dependsOn: z.string().optional(),
  executorType: z.enum(["csv_import", "form", "kestra", "temporal", "script", "manual"]),
  executorConfig: z.string().default("{}"),
})

export function OnboardingGlobal() {
  const { data, isLoading } = useGlobalOnboarding()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<any>(null)
  const [stepToDelete, setStepToDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const form = useForm<z.infer<typeof stepSchema>>({
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

  const selectedExecutor = form.watch("executorType");

  const helpText = useMemo(() => {
    switch (selectedExecutor) {
      case 'csv_import':
        return {
          title: "Importation CSV (BullMQ)",
          example: JSON.stringify({
            requiresCsv: true,
            targetTable: "test_data",
            expectedFields: ["date", "viewer", "sentiment"],
            flowId: "import_csv",
            namespace: "lovelace"
          }, null, 2),
          desc: "Déclenche l'interface d'upload et de mapping. Le worker BullMQ se charge du streaming vers ClickHouse."
        };
      case 'form':
        return {
          title: "Formulaire Dynamique",
          example: JSON.stringify({
            targetTable: "games",
            fields: [
              { key: "metacritic_url", label: "Lien Metacritic", type: "url", required: true, placeholder: "https://..." },
              { key: "ign_id", label: "ID IGN", type: "text", placeholder: "ex: halo-infinite" },
              { key: "priority", label: "Priorité", type: "number" }
            ]
          }, null, 2),
          desc: "Affiche un formulaire à l'utilisateur. Les données sont fusionnées dans la colonne 'metadata' de la table cible."
        };
      case 'kestra':
        return {
          title: "Workflow Kestra",
          example: JSON.stringify({
            flowId: "steam_sync_v1",
            namespace: "lovelace.data",
            additionalParams: { mode: "full" }
          }, null, 2),
          desc: "Appelle un webhook Kestra spécifique en passant les IDs nécessaires."
        };
      default:
        return null;
    }
  }, [selectedExecutor]);

  const onSubmit = async (values: z.infer<typeof stepSchema>) => {
    setActionLoading(true)
    try {
      const configObj = JSON.parse(values.executorConfig || "{}")
      const dependsOnArray = values.dependsOn 
        ? values.dependsOn.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : []

      await api.admin.onboarding.global.$post({
        json: { ...values, executorConfig: configObj, dependsOn: dependsOnArray },
        header: devHeaders(),
      })
      
      mutate(['global-onboarding'])
      setIsDialogOpen(false)
      form.reset()
      toast.success("Configuration enregistrée")
    } catch (e) {
      toast.error("Erreur de syntaxe JSON")
    } finally {
      setActionLoading(false)
    }
  }

  const onDelete = async () => {
    if (!stepToDelete) return
    setActionLoading(true)
    try {
      await api.admin.platforms['onboarding-steps'][':slug'].$delete({
        param: { slug: stepToDelete },
        header: devHeaders(),
      })
      mutate(['global-onboarding'])
      toast.success("Supprimé")
      setIsDeleteConfirmOpen(false)
    } catch (e) {
      toast.error("Erreur")
    } finally {
      setActionLoading(false)
    }
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: "order", header: "#" },
    {
      accessorKey: "title",
      header: "Étape",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="font-semibold">{row.getValue("title")}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.slug}</span>
        </div>
      )
    },
    { accessorKey: "executorType", header: "Moteur", cell: ({ row }) => <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded uppercase">{row.getValue("executorType")}</span> },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setEditingStep(row.original)
            form.reset({
              slug: row.original.slug,
              title: row.original.title,
              description: row.original.description || "",
              order: row.original.order,
              dependsOn: (row.original.dependsOn || []).join(', '),
              executorType: row.original.executorType,
              executorConfig: JSON.stringify(row.original.executorConfig, null, 2)
            })
            setIsDialogOpen(true)
          }}><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
            setStepToDelete(row.original.slug)
            setIsDeleteConfirmOpen(true)
          }}><Trash2 className="w-4 h-4" /></Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Onboarding Global</h1>
        <Button onClick={() => { setEditingStep(null); form.reset(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Créer une étape
        </Button>
      </div>

      {isLoading ? <div className="p-8 text-center text-muted-foreground italic">Chargement...</div> :
        <DataTable columns={columns} data={data?.steps || []} />}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
          <DialogHeader className="px-8 py-6 border-b bg-white shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              {editingStep ? "Modifier l'étape" : "Nouvelle étape globale"}
            </DialogTitle>
            <DialogDescription>Paramètres généraux et techniques de l'étape d'onboarding.</DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 pt-6 space-y-10 bg-slate-50/20">
              {/* SECTION 1: INFOS */}
              <div className="space-y-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 border-b pb-2">Informations générales</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Titre de l'étape</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="order" render={({ field }) => (
                    <FormItem><FormLabel>Ordre</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="bg-white" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="executorType" render={({ field }) => (
                    <FormItem><FormLabel className="font-bold text-primary">Moteur</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-white border-primary/20 focus:ring-primary/20"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="csv_import">Import CSV (BullMQ)</SelectItem>
                          <SelectItem value="form">Formulaire Dynamique</SelectItem>
                          <SelectItem value="kestra">Workflow Kestra</SelectItem>
                          <SelectItem value="temporal">Temporal</SelectItem>
                          <SelectItem value="script">Script Custom</SelectItem>
                          <SelectItem value="manual">Manuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug unique</FormLabel><FormControl><Input {...field} disabled={!!editingStep} className="bg-muted/30 font-mono" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="dependsOn" render={({ field }) => (
                    <FormItem><FormLabel>Dépendance (slugs)</FormLabel><FormControl><Input {...field} placeholder="step-prev-1, step-prev-2" className="bg-white" /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Aide pour l'utilisateur</FormLabel><FormControl><Textarea {...field} rows={2} className="bg-white" /></FormControl></FormItem>
                )} />
              </div>

              {/* SECTION 2: TECHNIQUE */}
              <div className="space-y-6 pb-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 border-b pb-2">Configuration technique</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <FormField control={form.control} name="executorConfig" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center gap-2"><Code2 className="w-4 h-4 text-blue-600" /> Config JSON</FormLabel>
                      <FormControl>
                        <Textarea className="font-mono text-xs h-[400px] bg-slate-900 text-blue-50 border-none rounded-xl p-6 shadow-inner focus-visible:ring-1 focus-visible:ring-blue-500/50" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />

                  <div className="space-y-3">
                    <label className="text-sm font-medium leading-none flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-600" /> Aide & Exemples
                    </label>
                    {helpText ? (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 space-y-4 shadow-sm">
                        <div className="font-bold text-xs uppercase text-emerald-700 tracking-wider flex justify-between">
                          <span>{helpText.title}</span>
                          <span className="text-[10px] text-emerald-600/60 font-mono">JSON SPEC</span>
                        </div>
                        <pre className="font-mono text-[11px] leading-relaxed whitespace-pre overflow-auto max-h-80 border border-emerald-200/50 bg-white p-5 rounded-lg text-emerald-900 shadow-sm">
                          {helpText.example}
                        </pre>
                        <p className="text-[11px] text-emerald-800/80 leading-relaxed font-medium bg-emerald-100/30 p-3 rounded-md border border-emerald-100/50 italic">
                          {helpText.desc}
                        </p>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground text-sm italic bg-white/50">
                        Choisissez un moteur pour afficher les instructions de paramétrage.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </Form>

          <DialogFooter className="px-8 py-6 border-t bg-white shrink-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={actionLoading} className="rounded-full">Annuler</Button>
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={actionLoading} className="px-12 rounded-full font-bold shadow-lg shadow-primary/20">
              {actionLoading ? "Enregistrement..." : "Valider l'étape"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog 
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={onDelete}
        isLoading={actionLoading}
        title="Supprimer l'étape"
        description="Attention, cette action retirera l'étape de tous les parcours d'onboarding."
      />
    </div>
  )
}
