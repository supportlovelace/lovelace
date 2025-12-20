import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useLocation } from 'wouter'
import { api, devHeaders } from '../lib/api'
import { useUsers } from '../hooks/use-users'
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
import { Eye, Plus } from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
  createdAt: string | null
  updatedAt: string | null
}

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Le nom est requis.",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
})

export function Users() {
  const [, setLocation] = useLocation()
  const { data: usersData, isLoading: loading, error } = useUsers()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Nom",
    },
    {
      accessorKey: "email",
      header: "Email",
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
        const user = row.original
        return (
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setLocation(`/users/${user.id}`)
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Détails
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
      email: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setCreateLoading(true)
    setCreateError(null)
    try {
      await api.admin.users.$post({
        json: values,
        header: devHeaders(),
      })
      await mutate(['users'])
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
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-gray-500">Gérez les utilisateurs et leurs permissions globales.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un utilisateur
          </Button>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Créez un nouvel utilisateur client pour lui assigner ensuite des accès.
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
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom complet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemple.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Création..." : "Créer l'utilisateur"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500 italic bg-white rounded-lg border">Chargement des utilisateurs...</div>
      ) : error ? (
        <div className="p-12 text-center text-sm text-red-600 bg-white rounded-lg border">Erreur lors de la récupération : {error}</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={usersData?.users ?? []} 
          onRowClick={(user) => setLocation(`/users/${user.id}`)}
        />
      )}
    </div>
  )
}
