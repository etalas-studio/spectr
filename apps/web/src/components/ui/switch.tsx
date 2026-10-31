"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center rounded-full bg-[rgb(var(--ap-ov,0_0_0)/0.15)] p-0.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-[18px] rounded-full bg-[var(--ap-surface,#fff)] shadow-sm transition-transform data-checked:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
