import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#48355E] text-white shadow-md hover:bg-[#48355E]/90",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline: "border border-[#48355E] text-[#48355E] bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-purple-800 text-white shadow-sm hover:bg-purple-800/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Amélioration du Glass pour la visibilité
        glass: "bg-white/20 backdrop-blur-md border border-white/30 shadow-sm text-foreground hover:bg-white/30",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
