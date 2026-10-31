import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        gray: "bg-[rgb(var(--ap-ov,0_0_0)/0.06)] text-[var(--ap-ink-2,#374151)]",
        green: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        amber: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300",
        blue: "bg-[rgba(38,94,228,0.1)] text-[var(--ap-accent-ink,#1e40af)]",
        red: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-300",
      },
    },
    defaultVariants: { tone: "gray" },
  }
)

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
}

export { Badge, badgeVariants }
