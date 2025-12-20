import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { api, devHeaders } from '../lib/api'
import { DataTable } from '../components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@repo/ui/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { HelpCircle, Plus, Pencil, Trash2, Globe } from 'lucide-react'

const tooltipSchema = z.object({
  slug: z.string().min(1, "Slug requis"),
  app: z.string().min(1, "App requise"),
  page: z.string().min(1, "Page requise"),
  color: z.enum(["violet", "blue", "green", "red", "gray"]).default("violet"),
})

const translationSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  content: z.string().min(1, "Contenu requis"),
})

export function Tooltips() {
  const { data, isLoading } = useSWR('tooltips', async () => {
    const res = await api.admin.tooltips.$get({ header: devHeaders() })
    return res.json()
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTooltip, setEditingTooltip] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("fr")

  const form = useForm<z.infer<typeof tooltipSchema>>({
    resolver: zodResolver(tooltipSchema),
    defaultValues: { slug: "", app: "admin", page: "general", color: "violet" }
  })

  const frForm = useForm<z.infer<typeof translationSchema>>({
    resolver: zodResolver(translationSchema),
    defaultValues: { title: "", content: "" }
  })

  const enForm = useForm<z.infer<typeof translationSchema>>({
    resolver: zodResolver(translationSchema),
    defaultValues: { title: "", content: "" }
  })

  const onSubmit = async (values: z.infer<typeof tooltipSchema>) => {
    setActionLoading(true)
    try {
      let tooltipId = editingTooltip?.id

      if (editingTooltip) {
        await api.admin.tooltips[':id'].$put({
          param: { id: tooltipId },
          json: values,
          header: devHeaders(),
        })
      } else {
        const res = await api.admin.tooltips.$post({
          json: values,
          header: devHeaders(),
        })
        const data = await res.json()
        if ('tooltip' in data) tooltipId = data.tooltip.id
      }

      // Save translations
      const frValues = frForm.getValues()
      const enValues = enForm.getValues()

      if (frValues.title && frValues.content) {
        await api.admin.tooltips[':id'].translations.$post({
          param: { id: tooltipId },
          json: { locale: 'fr', ...frValues },
          header: devHeaders(),
        })
      }

      if (enValues.title && enValues.content) {
        await api.admin.tooltips[':id'].translations.$post({
          param: { id: tooltipId },
          json: { locale: 'en', ...enValues },
          header: devHeaders(),
        })
      }

      toast.success("Tooltip enregistré")
      mutate('tooltips')
      setIsDialogOpen(false)
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setActionLoading(false)
    }
  }

  const onEdit = async (tooltip: any) => {
    setEditingTooltip(tooltip)
    form.reset({
      slug: tooltip.slug,
      app: tooltip.app,
      page: tooltip.page,
      color: tooltip.color,
    })

    // Fetch all translations for this tooltip
    const res = await api.admin.tooltips[':id'].$get({
      param: { id: tooltip.id },
      header: devHeaders()
    })
    const data = await res.json()
    
    if ('translations' in data) {
      const fr = data.translations.find((t: any) => t.locale === 'fr')
      const en = data.translations.find((t: any) => t.locale === 'en')
      
      frForm.reset({ title: fr?.title || "", content: fr?.content || "" })
      enForm.reset({ title: en?.title || "", content: en?.content || "" })
    }

    setIsDialogOpen(true)
  }

  const onDelete = async (id: string) => {
    if (!confirm("Supprimer ce tooltip ?")) return
    try {
      await api.admin.tooltips[':id'].$delete({ param: { id }, header: devHeaders() })
      toast.success("Supprimé")
      mutate('tooltips')
    } catch (e) {
      toast.error("Erreur")
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "slug",
      header: "Slug / ID",
      cell: ({ row }) => <code className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded">{row.getValue("slug")}</code>
    },
    { accessorKey: "app", header: "App" },
    { accessorKey: "page", header: "Page" },
    {
      accessorKey: "title",
      header: "Titre (FR)",
      cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("title") || "-"}</span>
    },
    {
      accessorKey: "color",
      header: "Couleur",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-${row.getValue("color") === 'violet' ? '[#48355E]' : row.getValue("color") + '-600'}`} 
               style={row.getValue("color") === 'violet' ? { backgroundColor: '#48355E' } : {}} />
          <span className="capitalize text-xs">{row.getValue("color")}</span>
        </div>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(row.original.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#48355E]">Aide & Tooltips</h1>
          <p className="text-gray-500">Gérez les aides contextuelles à travers toutes les applications.</p>
        </div>
        <Button onClick={() => { setEditingTooltip(null); form.reset(); frForm.reset(); enForm.reset(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Créer un tooltip
        </Button>
      </div>

      {isLoading ? <div className="p-8 text-center">Chargement...</div> :
        <DataTable columns={columns} data={data?.tooltips || []} />}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTooltip ? "Modifier le tooltip" : "Nouveau tooltip"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Base Config */}
            <div className="space-y-4 border-r pr-6">
              <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wider">Configuration</h3>
              <Form {...form}>
                <form className="space-y-3">
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug technique</FormLabel><FormControl><Input {...field} placeholder="ex: game-logo-help" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="app" render={({ field }) => (
                      <FormItem><FormLabel>Application</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="hub">The Hub</SelectItem><SelectItem value="playtest">Playtest</SelectItem></SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="page" render={({ field }) => (
                      <FormItem><FormLabel>Page</FormLabel><FormControl><Input {...field} placeholder="ex: games" /></FormControl></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="color" render={({ field }) => (
                    <FormItem><FormLabel>Couleur thématique</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="violet">Violet (Lovelace)</SelectItem>
                          <SelectItem value="blue">Bleu (Info)</SelectItem>
                          <SelectItem value="green">Vert (Success)</SelectItem>
                          <SelectItem value="red">Rouge (Alert)</SelectItem>
                          <SelectItem value="gray">Gris</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </form>
              </Form>
            </div>

            {/* Translations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wider">Contenu</h3>
                <Globe className="w-4 h-4 text-gray-400" />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fr">Français</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
                
                <TabsContent value="fr" className="space-y-3 pt-3">
                  <Form {...frForm}>
                    <div className="space-y-3">
                      <FormField control={frForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Titre FR</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={frForm.control} name="content" render={({ field }) => (
                        <FormItem><FormLabel>Description FR</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>
                      )} />
                    </div>
                  </Form>
                </TabsContent>

                <TabsContent value="en" className="space-y-3 pt-3">
                  <Form {...enForm}>
                    <div className="space-y-3">
                      <FormField control={enForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Title EN</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={enForm.control} name="content" render={({ field }) => (
                        <FormItem><FormLabel>Description EN</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>
                      )} />
                    </div>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={actionLoading}>
              {actionLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
