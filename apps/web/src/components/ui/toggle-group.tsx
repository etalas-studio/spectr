"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"

import { cn } from "@/lib/utils"

function ToggleGroup({ className, ...props }: ToggleGroupPrimitive.Props) {
  return <ToggleGroupPrimitive data-slot="toggle-group" className={cn("flex gap-2", className)} {...props} />
}

function ToggleGroupItem({ className, ...props }: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex h-9 flex-1 cursor-pointer items-center justify-center rounded-[12px] bg-[rgb(var(--ap-ov,0_0_0)/0.05)] px-4 text-sm font-medium text-[var(--ap-ink-2,#374151)] transition-colors outline-none hover:bg-[rgb(var(--ap-ov,0_0_0)/0.08)] focus-visible:ring-3 focus-visible:ring-ring/40 data-pressed:bg-linear-to-b data-pressed:from-[#2f6df0] data-pressed:to-[#1d4ed8] data-pressed:text-white data-pressed:shadow-[0_4px_10px_rgba(38,94,228,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]",
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
