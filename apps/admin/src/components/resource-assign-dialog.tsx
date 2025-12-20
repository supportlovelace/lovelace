import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select"
import { Button } from "@repo/ui/components/ui/button"
import { Combobox } from "@repo/ui/components/ui/combobox"
import { usePublishers } from "../hooks/use-publishers"
import { useStudios } from "../hooks/use-studios"
import { useGames } from "../hooks/use-games"
import { api, devHeaders } from "../lib/api"
import { mutate } from "swr"
import { toast } from "sonner"

const assignSchema = z.object({
  type: z.enum(["publisher", "studio", "game"]),
  resourceId: z.string().min(1, "La ressource est requise"),
  role: z.enum(["admin", "member"]),
})

interface ResourceAssignDialogProps {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResourceAssignDialog({ userId, userName, open, onOpenChange }: ResourceAssignDialogProps) {
  const [loading, setLoading] = useState(false)
  const form = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      type: "publisher",
      resourceId: "",
      role: "member",
    },
  })

  const type = form.watch("type")

  // Charger les listes en fonction du type sélectionné
  // Note: Optimisation possible -> ne charger que si type sélectionné
  const { data: pubsData } = usePublishers(type === "publisher" && open)
  const { data: studiosData } = useStudios(type === "studio" && open)
  const { data: gamesData } = useGames(type === "game" && open)

  // Reset resourceId when type changes
  useEffect(() => {
    form.setValue("resourceId", "")
  }, [type, form])

  // Préparer les items pour le Combobox
  const getItems = () => {
    switch (type) {
      case "publisher":
        return (pubsData?.publishers || []).map((p: any) => ({ value: p.id, label: p.name }))
      case "studio":
        return (studiosData?.studios || []).map((s: any) => ({ value: s.id, label: s.name }))
      case "game":
        return (gamesData?.games || []).map((g: any) => ({ value: g.id, label: g.name }))
      default:
        return []
    }
  }

  const onSubmit = async (values: z.infer<typeof assignSchema>) => {
    setLoading(true)
    try {
      if (values.type === "publisher") {
        await api.admin.publishers[':id'].users.$post({
          param: { id: values.resourceId },
          json: { userId, role: values.role, action: "add" },
          header: devHeaders(),
        })
      } else if (values.type === "studio") {
        await api.admin.studios[':id'].users.$post({
          param: { id: values.resourceId },
          json: { userId, role: values.role, action: "add" },
          header: devHeaders(),
        })
      } else if (values.type === "game") {
        await api.admin.games[':id'].users.$post({
          param: { id: values.resourceId },
          json: { userId, role: values.role, action: "add" },
          header: devHeaders(),
        })
      }

      await mutate(['user-perms', userId])
      toast.success("Accès ajouté avec succès")
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de l'ajout de l'accès")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Donner un accès</DialogTitle>
          <DialogDescription>
            Ajouter une permission pour <strong>{userName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de ressource</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper">
                      <SelectItem value="publisher">Publisher (Éditeur)</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="game">Jeu</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resource (Combobox) */}
            <FormField
              control={form.control}
              name="resourceId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ressource</FormLabel>
                  <FormControl>
                    <Combobox
                      items={getItems()}
                      value={field.value}
                      onSelect={field.onChange}
                      placeholder={`Chercher un ${type}...`}
                      emptyText="Aucun résultat trouvé."
                      modal
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
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
                    <SelectContent position="popper">
                      <SelectItem value="member">Membre (Lecture)</SelectItem>
                      <SelectItem value="admin">Admin (Gestion)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Ajout..." : "Ajouter l'accès"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
