import * as React from "react"

import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn("pointer-events-none inline-flex items-center rounded-md border border-[rgb(var(--ap-ov,0_0_0)/0.08)] bg-[var(--ap-surface,#fff)] px-1.5 py-0.5 font-sans text-[11px] text-[var(--ap-ink-3,#5b6472)] select-none", className)}
      {...props}
    />
  )
}

export { Kbd }
