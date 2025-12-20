import { useState } from 'react'
import { usePlatforms } from '../hooks/use-platforms'
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
import { Switch } from '@repo/ui/components/ui/switch'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api, devHeaders } from '../lib/api'
import { mutate } from 'swr'
import { toast } from 'sonner'
import { Share2, Plus, Pencil, Trash2 } from 'lucide-react'
import { useLocation } from 'wouter'

import { ImageUpload } from '../components/image-upload'

const platformSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  slug: z.string().min(1, "Slug requis"),
  logoAssetId: z.string().nullable().optional(),
  hasChannel: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

const CDN_URL = import.meta.env.VITE_CDN_URL ?? 'https://cdn.lovelace.gg'

export function Platforms() {
  const { data, isLoading } = usePlatforms()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [, setLocation] = useLocation()

  const form = useForm<z.infer<typeof platformSchema>>({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      name: "",
      slug: "",
      logoAssetId: null,
      hasChannel: false,
      isActive: true,
    }
  })

  const onSubmit = async (values: z.infer<typeof platformSchema>) => {
    setActionLoading(true)
    try {
      if (editingPlatform) {
        await api.admin.platforms[':id'].$put({
          param: { id: editingPlatform.id },
          json: values,
          header: devHeaders(),
        })
        toast.success("Plateforme mise à jour")
      } else {
        await api.admin.platforms.$post({
          json: values,
          header: devHeaders(),
        })
        toast.success("Plateforme créée")
      }
      await mutate(['platforms'])
      setIsDialogOpen(false)
      form.reset()
      setEditingPlatform(null)
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setActionLoading(false)
    }
  }

  const onEdit = (platform: any) => {
    setEditingPlatform(platform)
    form.reset({
      name: platform.name,
      slug: platform.slug,
      logoAssetId: platform.logoAssetId || null,
      hasChannel: platform.hasChannel,
      isActive: platform.isActive,
    })
    setIsDialogOpen(true)
  }

  const onDelete = async (id: string) => {
    if (!confirm("Supprimer cette plateforme du catalogue global ?")) return
    try {
      await api.admin.platforms[':id'].$delete({
        param: { id },
        header: devHeaders(),
      })
      toast.success("Plateforme supprimée")
      await mutate(['platforms'])
    } catch (e) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <div className="flex items-center font-medium">
          {row.original.logoAssetId ? (
            <img 
              src={`${CDN_URL}/assets/${row.original.logoAssetId}/48.webp`} 
              className="w-6 h-6 mr-2 object-contain" 
              alt="" 
            />
          ) : (
            <Share2 className="w-4 h-4 mr-2 text-gray-400" />
          )}
          {row.getValue("name")}
        </div>
      )
    },
    { accessorKey: "slug", header: "Slug" },
    { 
      accessorKey: "hasChannel", 
      header: "Canaux",
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.getValue("hasChannel") ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
          {row.getValue("hasChannel") ? "Oui" : "Non"}
        </span>
      )
    },
    { 
      accessorKey: "isActive", 
      header: "Statut",
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.getValue("isActive") ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {row.getValue("isActive") ? "Actif" : "Inactif"}
        </span>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(row.original.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalogue des Plateformes</h1>
          <p className="text-gray-500">Gérez les services tiers supportés par Lovelace.</p>
        </div>
        <Button onClick={() => { setEditingPlatform(null); form.reset(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une plateforme
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-500 text-white rounded-lg border bg-white">Chargement...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={data?.platforms || []} 
          onRowClick={(platform) => setLocation(`/platforms/${platform.id}`)}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlatform ? "Modifier la plateforme" : "Ajouter une plateforme"}</DialogTitle>
            <DialogDescription>Définissez les propriétés globales du service.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom (ex: Discord)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug technique (ex: discord)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoAssetId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload 
                        value={field.value} 
                        onChange={field.onChange} 
                        type="platform_logo" 
                        label="Logo de la plateforme"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasChannel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Canaux</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
