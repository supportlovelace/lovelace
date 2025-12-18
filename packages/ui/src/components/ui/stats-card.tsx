import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { TooltipLovelace } from "./tooltip-lovelace"

const statsCardVariants = cva(
  "h-14 w-full rounded-2xl bg-white p-2 shadow-sm transition-all hover:shadow-md",
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-md hover:shadow-lg",
        outlined: "border border-gray-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface Trend {
  label: string
  isPositive: boolean
}

interface StatsCardProps extends VariantProps<typeof statsCardVariants> {
  title: string
  value: string | number
  trend?: Trend
  icon?: React.ReactNode
  tooltipContent?: string
  className?: string
}

function StatsCard({
  title,
  value,
  trend,
  icon,
  tooltipContent,
  variant,
  className,
  ...props
}: StatsCardProps) {
  const cardContent = (
    <div
      data-slot="stats-card"
      className={cn(statsCardVariants({ variant, className }))}
      {...props}
    >
      <div className="flex h-full w-full items-center">
        {/* Première colonne (3/4) : title, value + trend */}
        <div className="flex w-3/4 flex-col justify-center">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">{title}</p>
            {tooltipContent && (
              <div className="h-3 w-3 rounded-full bg-gray-200" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-medium text-gray-900">{value}</p>
            {trend && (
              <span
                className={cn(
                  "text-xs",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.label}
              </span>
            )}
          </div>
        </div>

        {/* Deuxième colonne (1/4) : icône centrée */}
        <div className="flex w-1/4 items-center justify-center">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#48355E]">
              <Slot className="h-5 w-5 text-white">{icon}</Slot>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (tooltipContent) {
    return (
      <TooltipLovelace
        title={title}
        content={tooltipContent}
        color="violet"
      >
        {cardContent}
      </TooltipLovelace>
    )
  }

  return cardContent
}

export { StatsCard, statsCardVariants }
export type { StatsCardProps, Trend }
