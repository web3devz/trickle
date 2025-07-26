import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[30px] text-sm font-medium ring-offset-white transition-all gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:cursor-pointer",
  {
    variants: {
      variant: {
        reverse:
          "text-mtext bg-[#CCFF00] border-2 border-black shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)]",
        noShadow: 
          "text-mtext bg-[#CCFF00] border-2 border-black",
        neutral:
          "bg-white text-black border-2 border-black shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)]",
        default:
          "text-mtext bg-[#CCFF00] border-2 border-black shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)]",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4",
        lg: "h-14 px-8",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
