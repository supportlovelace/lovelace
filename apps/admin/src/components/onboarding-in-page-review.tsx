import { useState, useEffect } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Label } from "@repo/ui/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert"
import { Zap, AlertTriangle } from 'lucide-react'
import { submitOnboardingRequest } from '../hooks/use-onboarding-requests'
import { toast } from 'sonner'

export function OnboardingInPageReview({ request, onSuccess }: { request: any, onSuccess: () => void }) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const steps = request.config.steps || []

  useEffect(() => {
    setSelectedSlugs(steps.map((s: any) => s.slug))
  }, [steps])

  const toggleSlug = (slug: string) => {
    setSelectedSlugs(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const onConfirm = async () => {
    setLoading(true)
    try {
      await submitOnboardingRequest(request.id, { validatedSlugs: selectedSlugs })
      toast.success("Plan validé, l'onboarding démarre !")
      onSuccess()
    } catch (e) {
      toast.error("Erreur de validation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-1 animate-in fade-in slide-in-from-top-4 duration-500">
      <Alert className="bg-orange-50 border-orange-200 shadow-sm border-l-4 border-l-orange-500">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800 font-bold">Action Requise : Validation du Plan</AlertTitle>
        <AlertDescription className="text-orange-700">
          Temporal a identifié les étapes suivantes pour ce jeu. Veuillez confirmer la sélection avant de lancer l'exécution automatique.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {steps.map((step: any) => {
          const isSelected = selectedSlugs.includes(step.slug);
          return (
            <div 
              key={step.slug} 
              onClick={() => toggleSlug(step.slug)}
              className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                isSelected 
                  ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500/10' 
                  : 'bg-slate-50 border-slate-200 opacity-50 grayscale shadow-none'
              }`}
            >
              <Checkbox 
                id={`review-${step.slug}`} 
                checked={isSelected}
                onCheckedChange={() => toggleSlug(step.slug)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label 
                  htmlFor={`review-${step.slug}`}
                  className="text-sm font-bold cursor-pointer"
                >
                  {step.title}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wider">
                    {step.platformName || 'Général'}
                  </span>
                  {step.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 pt-6 pb-8 border-t">
        <Button 
          onClick={onConfirm} 
          disabled={loading || selectedSlugs.length === 0} 
          size="lg"
          className="rounded-full px-16 py-7 text-lg font-bold shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95"
        >
          {loading ? "Initialisation..." : "Confirmer et Lancer"}
          <Zap className="ml-3 w-5 h-5 fill-current" />
        </Button>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Cette action lancera les workflows en parallèle
        </p>
      </div>
    </div>
  )
}
