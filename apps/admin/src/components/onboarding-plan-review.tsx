import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/ui/dialog"
import { Button } from '@repo/ui/components/ui/button'
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Label } from "@repo/ui/components/ui/label"
import { submitOnboardingRequest } from '../hooks/use-onboarding-requests'
import { toast } from 'sonner'

export function OnboardingPlanReview({ request, onSuccess }: { request: any, onSuccess: () => void }) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const steps = request.config.steps || []

  // Par défaut, tout est sélectionné
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
      toast.error("Erreur lors de la validation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!request} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Validation du plan d'onboarding</DialogTitle>
          <DialogDescription>
            Vérifiez les étapes détectées pour ce jeu avant de lancer l'exécution.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((step: any) => (
            <div key={step.slug} className="flex items-start space-x-3 space-y-0 rounded-md border p-4 bg-white shadow-sm">
              <Checkbox 
                id={step.slug} 
                checked={selectedSlugs.includes(step.slug)}
                onCheckedChange={() => toggleSlug(step.slug)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label 
                  htmlFor={step.slug}
                  className="text-sm font-bold leading-none cursor-pointer"
                >
                  {step.title}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded uppercase">
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
          ))}
        </div>

        <DialogFooter className="border-t pt-6 bg-slate-50/50 -mx-6 px-6 pb-6 rounded-b-lg">
          <Button variant="outline" disabled={loading}>Annuler</Button>
          <Button onClick={onConfirm} disabled={loading || selectedSlugs.length === 0} className="px-8">
            {loading ? "Lancement..." : "Confirmer et Lancer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
