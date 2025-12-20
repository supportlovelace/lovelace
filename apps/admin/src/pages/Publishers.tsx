import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useLocation } from 'wouter'
import { api, devHeaders } from '../lib/api'
import { usePublishers } from '../hooks/use-publishers'
import { mutate } from 'swr'
import { Button } from '@repo/ui/components/ui/button'
import { DataTable } from '../components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog'
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
import { Building2, Eye, Plus } from 'lucide-react'

type Publisher = {
  id: string
  name: string
  description: string | null
  createdAt: string | null
  updatedAt: string | null
}

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Le nom est requis.",
  }),
  description: z.string().optional(),
})

export function Publishers() {
  const [, setLocation] = useLocation()
  const { data: publishersData, isLoading: loading, error } = usePublishers(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const columns: ColumnDef<Publisher>[] = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <div className="flex items-center font-medium">
          <Building2 className="w-4 h-4 mr-2 text-blue-500" />
          {row.getValue("name")}
        </div>
      )
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate text-gray-500">
          {row.getValue("description") || "-"}
        </div>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Créé le",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string
        return date ? new Date(date).toLocaleDateString() : "-"
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const publisher = row.original
        return (
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setLocation(`/publishers/${publisher.id}`)
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir
            </Button>
          </div>
        )
      }
    }
  ]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setCreateLoading(true)
    setCreateError(null)
    try {
      await api.admin.publishers.$post({
        json: values,
        header: devHeaders(),
      })
      await mutate(['publishers'])
      setIsDialogOpen(false)
      form.reset()
    } catch (e) {
      setCreateError((e as Error).message)
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Structure : Publishers</h1>
          <p className="text-gray-500">Gérez les éditeurs de jeux et leur hiérarchie.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Publisher
          </Button>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer un Publisher</DialogTitle>
              <DialogDescription>
                L'étape racine pour configurer un nouvel écosystème client.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {createError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                    {createError}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'éditeur</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Ubisoft, EA..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notes sur ce publisher..." 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Création..." : "Créer le Publisher"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500 italic bg-white rounded-lg border">Chargement des éditeurs...</div>
      ) : error ? (
        <div className="p-12 text-center text-sm text-red-600 bg-white rounded-lg border">Erreur lors de la récupération : {error}</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={publishersData?.publishers ?? []} 
          onRowClick={(pub) => setLocation(`/publishers/${pub.id}`)}
        />
      )}
    </div>
  )
}
