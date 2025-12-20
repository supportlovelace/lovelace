import { TooltipLovelace } from '@repo/ui/components/ui/tooltip-lovelace'
import { useTooltipRegistry } from '../contexts/TooltipContext'
import { ReactNode } from 'react'

interface SmartTooltipProps {
  slug: string
  children: ReactNode
  fallbackTitle?: string
  fallbackContent?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function SmartTooltip({ 
  slug, 
  children, 
  fallbackTitle, 
  fallbackContent,
  side = "top",
  align = "center"
}: SmartTooltipProps) {
  const { tooltips, isLoading } = useTooltipRegistry()
  const data = tooltips[slug]

  if (isLoading || !data) {
    // Si on a des fallbacks, on les utilise, sinon on affiche juste les enfants sans tooltip
    if (fallbackTitle && fallbackContent) {
      return (
        <TooltipLovelace 
          title={fallbackTitle} 
          content={fallbackContent}
          side={side}
          align={align}
        >
          {children}
        </TooltipLovelace>
      )
    }
    return <>{children}</>
  }

  return (
    <TooltipLovelace 
      title={data.title} 
      content={data.content} 
      color={data.color}
      side={side}
      align={align}
    >
      {children}
    </TooltipLovelace>
  )
}
