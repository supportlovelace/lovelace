import { createContext, useContext, ReactNode } from 'react'
import useSWR from 'swr'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface TooltipData {
  title: string
  content: string
  color: 'violet' | 'blue' | 'green' | 'red' | 'gray'
}

interface TooltipContextType {
  tooltips: Record<string, TooltipData>
  isLoading: boolean
}

const TooltipContext = createContext<TooltipContextType>({
  tooltips: {},
  isLoading: true,
})

export function TooltipProvider({ 
  children, 
  app, 
  locale = 'fr' 
}: { 
  children: ReactNode, 
  app: string, 
  locale?: string 
}) {
  const { data, isLoading } = useSWR(`tooltips-${app}-${locale}`, async () => {
    const res = await fetch(`${API_BASE_URL}/tooltips/${app}?locale=${locale}`)
    if (!res.ok) return { tooltips: {} }
    return res.json()
  })

  return (
    <TooltipContext.Provider value={{ tooltips: data?.tooltips || {}, isLoading }}>
      {children}
    </TooltipContext.Provider>
  )
}

export const useTooltipRegistry = () => useContext(TooltipContext)
