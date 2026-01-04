import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/ui/dialog"
import { Button } from '@repo/ui/components/ui/button'
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { submitOnboardingRequest } from '../hooks/use-onboarding-requests'
import { api, devHeaders } from '../lib/api'
import { toast } from 'sonner'
import { Settings2, Save, X } from 'lucide-react'

interface OnboardingConfigFormProps {
  request: any
  gameId: string
  onSuccess: () => void
  onClose: () => void
}

export function OnboardingConfigForm({ request, gameId, onSuccess, onClose }: OnboardingConfigFormProps) {

  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({})

  const [loading, setLoading] = useState(false)



  const { isBatch, updates, platformSlug, missingFields } = request.config;



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setLoading(true);

    try {

      let res;

      if (isBatch) {

        res = await api.admin.onboarding['config-update'].$post({

          json: {

            gameId,

            updates: updates.map((u: any) => ({

              platformSlug: u.platformSlug,

              config: formData[u.platformSlug] || {}

            }))

          },

          header: devHeaders()

        });

      } else {

        res = await api.admin.onboarding['config-update'].$post({

          json: {

            gameId,

            platformSlug,

            config: formData[platformSlug] || {}

          },

          header: devHeaders()

        });

      }



      if (!res.ok) throw new Error("Erreur API");



      await submitOnboardingRequest(request.id, { updated: true });

      

      toast.success("Configuration mise à jour !");

      onSuccess();

    } catch (e) {

      toast.error("Erreur lors de la mise à jour");

    } finally {

      setLoading(false);

    }

  }



  const renderFields = (slug: string, fields: string[]) => (

    <div key={slug} className="space-y-4 border-l-2 border-blue-200 pl-4 py-2">

      <div className="flex items-center gap-2 mb-2">

        <div className="w-2 h-2 rounded-full bg-blue-500" />

        <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">{slug}</h4>

      </div>

      {fields.map((field: string) => (

        <div key={field} className="grid gap-2">

          <Label htmlFor={`${slug}-${field}`} className="text-[10px] font-bold uppercase text-slate-500">{field}</Label>

          <Input 

            id={`${slug}-${field}`} 

            required

            value={formData[slug]?.[field] || ''} 

            onChange={(e) => setFormData(prev => ({ 

              ...prev, 

              [slug]: { ...(prev[slug] || {}), [field]: e.target.value } 

            }))}

            className="bg-slate-50 border-slate-200 h-8 text-sm"

          />

        </div>

      ))}

    </div>

  );



  return (

    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>

      <DialogContent className="sm:max-w-[425px]">

        <DialogHeader>

          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">

            <Settings2 className="w-5 h-5 text-blue-600" />

          </div>

          <DialogTitle>

            {isBatch ? "Configurations Multi-Plateformes" : `Configuration : ${platformSlug}`}

          </DialogTitle>

          <DialogDescription className="text-xs">

            Temporal a besoin de ces informations pour continuer l'onboarding.

          </DialogDescription>

        </DialogHeader>



        <form onSubmit={handleSubmit} className="space-y-6 py-4">

          <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2">

            {isBatch ? (

              updates.map((u: any) => renderFields(u.platformSlug, u.missingFields))

            ) : (

              renderFields(platformSlug, missingFields)

            )}

          </div>



          <DialogFooter className="pt-4 flex gap-2">

            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="rounded-full">

              Plus tard

            </Button>

            <Button type="submit" disabled={loading} className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700">

              {loading ? "Traitement..." : "Tout valider et Continuer"}

              <Save className="ml-2 w-4 h-4" />

            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>

  )

}
