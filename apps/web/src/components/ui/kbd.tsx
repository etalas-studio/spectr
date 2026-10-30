import * as React from "react"

import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn("pointer-events-none inline-flex items-center rounded-md border border-black/[0.08] bg-white px-1.5 py-0.5 font-sans text-[11px] text-gray-500 select-none", className)}
      {...props}
    />
  )
}

export { Kbd }
