import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-12 w-full min-w-0 rounded-[30px] bg-white px-6 py-3 text-base outline-none transition-all",
        "border-2 border-transparent",
        "hover:border-black focus:border-black",
        "file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "placeholder:text-gray-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
