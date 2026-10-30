"use client"

import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"

import { cn } from "@/lib/utils"

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn("flex flex-col gap-2", className)} {...props} />
}

/** A selectable row: the whole row is the radio, with a round indicator on the right. */
function RadioCard({ className, children, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-card"
      className={cn(
        "group/radio flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-black/[0.02] px-3.5 py-3 text-left transition-colors outline-none hover:bg-black/[0.04] focus-visible:ring-3 focus-visible:ring-ring/40 data-checked:border-primary/40 data-checked:bg-primary/[0.07]",
        className
      )}
      {...props}
    >
      {children}
      <span className="ml-auto flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-black/20 group-data-checked/radio:border-primary">
        <RadioPrimitive.Indicator className="size-2 rounded-full bg-primary" />
      </span>
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioCard }
