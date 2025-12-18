import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const tooltipLovelaceVariants = cva(
  "max-w-xs rounded-lg border border-gray-200 bg-white p-0 shadow-lg",
  {
    variants: {
      color: {
        violet: "border-gray-200",
        blue: "border-blue-200",
        green: "border-green-200",
        red: "border-red-200",
        gray: "border-gray-200",
      },
    },
    defaultVariants: {
      color: "violet",
    },
  }
)

interface TooltipLovelaceProps extends VariantProps<typeof tooltipLovelaceVariants> {
  title: string
  content: string
  children: React.ReactNode
  className?: string
}

function TooltipLovelace({
  title,
  content,
  color,
  children,
  className,
  ...props
}: TooltipLovelaceProps) {
  const getColorClasses = () => {
    switch (color) {
      case "blue":
        return "bg-blue-600"
      case "green":
        return "bg-green-600"
      case "red":
        return "bg-red-600"
      case "gray":
        return "bg-gray-600"
      default:
        return "bg-[#48355E]"
    }
  }

  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <div className="cursor-help" {...props}>
            {children}
          </div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className={cn(tooltipLovelaceVariants({ color, className }))}
            sideOffset={5}
            avoidCollisions
          >
            <div className={cn("rounded-t-lg px-3 py-2", getColorClasses())}>
              <p className="text-sm font-medium text-white text-center">{title}</p>
            </div>
            <div className="rounded-b-lg bg-white px-3 py-2">
              <p className="text-xs text-black">{content}</p>
            </div>
            <TooltipPrimitive.Arrow className="fill-white" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export { TooltipLovelace, tooltipLovelaceVariants }
export type { TooltipLovelaceProps }
