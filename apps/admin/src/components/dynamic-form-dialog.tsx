import { useState, useEffect } from 'react'
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
import { Loader2, Save, Shield, Users, Crown, Terminal, Gamepad2, User } from "lucide-react"
import { toast } from 'sonner'
import { api, devHeaders } from '../lib/api'
import { useGameRoles } from '../hooks/use-games'
import { RoleMultiSelect } from './role-multi-select'
import { submitOnboardingRequest } from '../hooks/use-onboarding-requests'

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
  requestId?: string
  onSuccess: () => void
}

const CATEGORIES = [
  { id: 'admin', label: 'Administrateurs', icon: Crown, desc: "Accès total au Hub" },
  { id: 'moderator', label: 'Modérateurs', icon: Shield, desc: "Gestion de la communauté" },
  { id: 'developer', label: 'Développeurs', icon: Terminal, desc: "Staff technique" },
  { id: 'community_manager', label: 'Community Managers', icon: Users, desc: "Communication" },
  { id: 'playtester', label: 'Playtesters', icon: Gamepad2, desc: "Accès beta/privé" },
  { id: 'member', label: 'Membres', icon: User, desc: "Utilisateurs standards" },
]

function RoleMapperForm({ gameId, step, requestId, onSuccess }: { gameId: string, step: any, requestId?: string, onSuccess: () => void }) {
  const { data: rolesData, isLoading: rolesLoading } = useGameRoles(gameId)
  const [mapping, setMapping] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  // Initialiser le mapping avec les catégories existantes des rôles
  useEffect(() => {
    if (rolesData?.roles) {
      const initial: Record<string, string[]> = {}
      rolesData.roles.forEach((r: any) => {
        const cat = r.category || 'member'
        if (!initial[cat]) initial[cat] = []
        initial[cat].push(r.id)
      })
      setMapping(initial)
    }
  }, [rolesData])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // 1. Transformer le mapping UI (Catégorie -> [RoleID]) en Payload API ({ RoleID -> Catégorie })
      const apiPayload: Record<string, string> = {}
      Object.entries(mapping).forEach(([category, roleIds]) => {
        roleIds.forEach(roleId => {
          apiPayload[roleId] = category
        })
      })

      // 2. Appel API Mapping (Sauvegarde des données)
      const res = await (api.admin.games[':id'] as any).roles.mapping.$post({
        param: { id: gameId },
        json: { mapping: apiPayload },
        header: devHeaders(),
      })

      if (!res.ok) throw new Error('Erreur sauvegarde mapping')

      // 3. Signal Temporal (Onboarding Request)
      if (requestId) {
        await submitOnboardingRequest(requestId, { mappingCount: Object.keys(apiPayload).length })
      } else {
        // Fallback si pas de request (ex: mode manuel sans workflow)
        await api.admin.onboarding[':gameId'][':slug']['complete'].$post({
          param: { gameId, slug: step.slug },
          json: { status: 'completed', result: { mappingCount: Object.keys(apiPayload).length } },
          header: devHeaders(),
        })
      }

      toast.success("Rôles mis à jour")
      onSuccess()
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSubmitting(false)
    }
  }

  if (rolesLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>

  const allRoles = rolesData?.roles || []

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="space-y-2 border-b pb-4 last:border-0">
            <div className="flex items-center gap-2">
              <cat.icon className="w-4 h-4 text-slate-500" />
              <div>
                <h4 className="text-sm font-semibold">{cat.label}</h4>
                <p className="text-[10px] text-slate-400">{cat.desc}</p>
              </div>
            </div>
            <RoleMultiSelect
              roles={allRoles}
              selectedRoleIds={mapping[cat.id] || []}
              onSelectionChange={(ids) => {
                // Quand on ajoute un rôle ici, on doit le retirer des autres catégories pour éviter les doublons
                const newMapping = { ...mapping }
                
                // 1. Retirer les IDs sélectionnés des autres catégories
                Object.keys(newMapping).forEach(c => {
                  if (c !== cat.id && newMapping[c]) {
                    newMapping[c] = newMapping[c].filter(id => !ids.includes(id))
                  }
                })
                
                // 2. Mettre à jour la catégorie courante
                newMapping[cat.id] = ids
                setMapping(newMapping)
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Enregistrer le Mapping
        </Button>
      </div>
    </div>
  )
}

export function DynamicFormDialog({
  open,
  onOpenChange,
  gameId,
  step,
  requestId,
  onSuccess
}: DynamicFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Détection du type de formulaire
  const formType = step.executorConfig?.params?.formType || 'GENERIC'

  const fields: FieldConfig[] = step.executorConfig?.fields || []

  // Création dynamique du schéma Zod (uniquement pour GENERIC)
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

  const onSubmitGeneric = async (values: any) => {
    setIsLoading(true)
    try {
      if (requestId) {
        await submitOnboardingRequest(requestId, values)
      } else {
        const res = await api.admin.onboarding[':gameId'][':slug']['complete'].$post({
          param: { gameId, slug: step.slug },
          json: { status: 'completed', result: values },
          header: devHeaders(),
        })
        if (!res.ok) throw new Error('Erreur API')
      }
      
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
      <DialogContent className={formType === 'ROLE_MAPPING' ? "sm:max-w-[600px]" : "sm:max-w-[450px]"}>
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>
            {step.description || "Veuillez remplir les informations suivantes."}
          </DialogDescription>
        </DialogHeader>

        {formType === 'ROLE_MAPPING' ? (
          <RoleMapperForm gameId={gameId} step={step} requestId={requestId} onSuccess={() => { onSuccess(); onOpenChange(false); }} />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitGeneric)} className="space-y-4 py-4">
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
        )}
      </DialogContent>
    </Dialog>
  )
}
