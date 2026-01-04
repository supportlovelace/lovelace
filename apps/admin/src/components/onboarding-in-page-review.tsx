import { useState, useEffect } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Label } from "@repo/ui/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert"
import { 
  Zap, 
  AlertTriangle
} from 'lucide-react'
import { submitOnboardingRequest } from '../hooks/use-onboarding-requests'
import { usePlatforms } from '../hooks/use-platforms'
import { toast } from 'sonner'

const CDN_URL = import.meta.env.VITE_CDN_URL ?? 'https://cdn.lovelace.gg'

export function OnboardingInPageReview({ request, onSuccess }: { request: any, onSuccess: () => void }) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  const { data: platformsData } = usePlatforms()

  const steps = request.config.steps || []
  const platforms = platformsData?.platforms || []

  // Grouping logic
  const groupedSteps = steps.reduce((acc: any, step: any) => {
    const key = step.platformName || 'Général';
    if (!acc[key]) {
      acc[key] = {
        name: key,
        slug: step.platform || 'general',
        color: step.platformColor || '#64748b', // Slate-500 par défaut
        steps: []
      };
    }
    acc[key].steps.push(step);
    return acc;
  }, {});

  // Sort groups: General first, then others
  const sortedGroups = Object.values(groupedSteps).sort((a: any, b: any) => {
    if (a.name === 'Général') return -1;
    if (b.name === 'Général') return 1;
    return a.name.localeCompare(b.name);
  });

  useEffect(() => {
    setSelectedSlugs(steps.map((s: any) => s.slug))
  }, [steps])

  const getPlatformIcon = (slug: string) => {
    // Uniquement le logo de la DB via le slug
    const platform = platforms.find((p: any) => p.slug === slug.toLowerCase())
    if (platform?.logoAssetId) {
       return <img src={`${CDN_URL}/assets/${platform.logoAssetId}/192.webp`} alt={slug} className="w-5 h-5 object-contain" />
    }
    return null;
  }

  const toggleSlug = (targetSlug: string) => {
    setSelectedSlugs(prev => {
      const isChecking = !prev.includes(targetSlug)
      const newSelection = new Set(prev)

      if (isChecking) {
        const addRecursive = (slug: string) => {
          if (newSelection.has(slug)) return
          newSelection.add(slug)
          const step = steps.find((s: any) => s.slug === slug)
          if (step?.dependsOn) {
            step.dependsOn.forEach((parentSlug: string) => addRecursive(parentSlug))
          }
        }
        addRecursive(targetSlug)
      } else {
        const removeRecursive = (slug: string) => {
          if (!newSelection.has(slug)) return
          newSelection.delete(slug)
          const children = steps.filter((s: any) => s.dependsOn?.includes(slug))
          children.forEach((child: any) => removeRecursive(child.slug))
        }
        removeRecursive(targetSlug)
      }

      return Array.from(newSelection)
    })
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
    <div className="space-y-8 p-1 animate-in fade-in slide-in-from-top-4 duration-500">
      <Alert className="bg-orange-50 border-orange-200 shadow-sm border-l-4 border-l-orange-500">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800 font-bold">Action Requise : Validation du Plan</AlertTitle>
        <AlertDescription className="text-orange-700">
          Temporal a identifié les étapes suivantes pour ce jeu. Veuillez confirmer la sélection avant de lancer l'exécution automatique.
        </AlertDescription>
      </Alert>

      <div className="space-y-12">
        {sortedGroups.map((group: any) => {
          const isGeneral = group.name === 'Général';
          const icon = getPlatformIcon(group.slug);
          
          return (
            <div key={group.name} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b-2" style={{ borderColor: isGeneral ? '#e2e8f0' : `${group.color}40` }}>
                {icon && (
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${group.color}15`, color: group.color }}
                  >
                    {icon}
                  </div>
                )}
                <div>
                  <h3 className={`text-lg font-semibold uppercase tracking-wider ${isGeneral ? 'text-slate-500' : ''}`} style={!isGeneral ? { color: group.color } : {}}>
                    {group.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.1em]">
                    {group.steps.length} action{group.steps.length > 1 ? 's' : ''} plateforme
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.steps.map((step: any) => {
                  const isSelected = selectedSlugs.includes(step.slug);
                  return (
                    <div 
                      key={step.slug} 
                      onClick={() => toggleSlug(step.slug)}
                      className={`group relative flex items-start space-x-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? 'bg-white shadow-lg ring-1 ring-black/5' 
                          : 'bg-slate-50/50 border-slate-200 opacity-60 grayscale hover:opacity-80 shadow-none'
                      }`}
                      style={isSelected && !isGeneral ? { borderColor: group.color } : isSelected ? { borderColor: '#64748b' } : {}}
                    >
                      <div className="flex items-center h-5">
                        <Checkbox 
                          id={`review-${step.slug}`} 
                          checked={isSelected}
                          onCheckedChange={() => toggleSlug(step.slug)}
                          onClick={(e) => e.stopPropagation()}
                          className={`transition-colors ${isSelected && !isGeneral ? 'border-none' : ''}`}
                          style={isSelected && !isGeneral ? { backgroundColor: group.color } : {}}
                        />
                      </div>
                      
                      <div className="grid gap-1.5 leading-none w-full">
                        <Label 
                          htmlFor={`review-${step.slug}`}
                          className={`text-sm font-bold cursor-pointer transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}
                        >
                          {step.title}
                        </Label>
                        
                        {step.description && (
                          <p className="text-[13px] text-slate-500 leading-relaxed">
                            {step.description}
                          </p>
                        )}

                        {/* Affichage des dépendances directes */}
                        {step.dependsOn && step.dependsOn.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {step.dependsOn.map((parentSlug: string) => {
                              const parent = steps.find((s: any) => s.slug === parentSlug);
                              return (
                                <span 
                                  key={parentSlug} 
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                    isSelected 
                                      ? 'bg-slate-50 text-slate-600 border-slate-200' 
                                      : 'bg-slate-100 text-slate-400 border-transparent'
                                  }`}
                                >
                                  REQUIS: {parent ? parent.title : parentSlug}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
          Cette action lancera les workflows en parallèle par plateforme
        </p>
      </div>
    </div>
  )
}