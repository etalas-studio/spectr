import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="card" className={cn("rounded-2xl border bg-[var(--ap-surface,#fff)] p-5", className)} {...props} />
}

export { Card }
