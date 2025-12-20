import { useEffect } from 'react'
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import useSWR, { mutate } from 'swr'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Type pour une étape du tour
export interface OnboardingStep {
  element: string
  popover: {
    title: string
    description: string
    side?: "top" | "bottom" | "left" | "right"
    align?: "start" | "center" | "end"
  }
}

export function useOnboarding(tourSlug: string, steps: OnboardingStep[]) {
  // 1. Récupérer les tours déjà complétés
  const { data: completedSteps, isLoading } = useSWR('onboarding-completed', async () => {
    const res = await fetch(`${API_BASE_URL}/portal/onboarding/completed`, {
      headers: {
        'x-user-id': import.meta.env.VITE_DEV_USER_ID // Utilise le même mécanisme que ton API client
      }
    })
    const json = await res.json()
    return json.completed as string[]
  })

  useEffect(() => {
    // 2. Si le tour n'a pas encore été fait et qu'on a fini de charger
    if (!isLoading && completedSteps && !completedSteps.includes(tourSlug)) {
      
      const driverObj = driver({
        showProgress: true,
        nextBtnText: 'Suivant',
        prevBtnText: 'Précédent',
        doneBtnText: 'Terminer',
        allowClose: false, // Force à finir le tour
        onDeselected: (element, step, { config, state }) => {
          // Si on est à la dernière étape
          if (state.activeIndex === steps.length - 1) {
            markAsCompleted()
          }
        },
        steps: steps as any
      })

      // Un petit délai pour s'assurer que le DOM est prêt
      const timer = setTimeout(() => {
        driverObj.drive()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isLoading, completedSteps, tourSlug])

  // 3. Fonction pour marquer le tour comme fini en DB
  const markAsCompleted = async () => {
    try {
      await fetch(`${API_BASE_URL}/portal/onboarding/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': import.meta.env.VITE_DEV_USER_ID
        },
        body: JSON.stringify({ stepSlug: tourSlug })
      })
      // Mettre à jour le cache local pour ne plus le relancer
      mutate('onboarding-completed', [...(completedSteps || []), tourSlug], false)
    } catch (e) {
      console.error("Erreur lors de la sauvegarde de l'onboarding", e)
    }
  }
}
