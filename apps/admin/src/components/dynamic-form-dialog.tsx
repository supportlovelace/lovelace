import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Save } from "lucide-react"
import { toast } from 'sonner'
import { api, devHeaders } from '../lib/api'

interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'number' | 'url'
  placeholder?: string
  required?: boolean
}

interface DynamicFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: string
  step: any
  onSuccess: () => void
}

export function DynamicFormDialog({
  open,
  onOpenChange,
  gameId,
  step,
  onSuccess
}: DynamicFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const fields: FieldConfig[] = step.executorConfig?.fields || []

  // Création dynamique du schéma Zod
  const shape: any = {}
  fields.forEach(f => {
    let s = z.string()
    if (f.required) s = s.min(1, `${f.label} est requis`)
    else s = s.optional().or(z.literal(''))
    
    if (f.type === 'url') s = s.url("URL invalide")
    shape[f.key] = s
  })
  
  const schema = z.object(shape)
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce((acc: any, f) => ({ ...acc, [f.key]: "" }), {})
  })

  const onSubmit = async (values: any) => {
    setIsLoading(true)
    try {
      const res = await api.admin.onboarding[':gameId'][':slug']['submit-form'].$post({
        param: { gameId, slug: step.slug },
        json: values,
        header: devHeaders(),
      })

      if (!res.ok) throw new Error('Erreur API')
      
      toast.success("Informations enregistrées")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error("Impossible de sauvegarder")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>
            {step.description || "Veuillez remplir les informations suivantes pour compléter cette étape."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {fields.map(f => (
              <FormField
                key={f.key}
                control={form.control}
                name={f.key}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f.label}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type={f.type === 'number' ? 'number' : 'text'} 
                        placeholder={f.placeholder}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
