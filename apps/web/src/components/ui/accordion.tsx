"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot="accordion" className={cn("flex flex-col gap-1.5", className)} {...props} />
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("overflow-hidden rounded-xl border bg-[var(--ap-surface,#fff)]", className)} {...props} />
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn("group/trigger flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-sm font-medium transition-colors outline-none hover:bg-[rgb(var(--ap-ov,0_0_0)/0.02)] focus-visible:ring-3 focus-visible:ring-ring/40 data-panel-open:bg-primary/[0.04]", className)}
        {...props}
      >
        {children}
        <ChevronDown className="size-3.5 shrink-0 text-[var(--ap-ink-4,#6b7280)] transition-transform group-data-panel-open/trigger:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, ...props }: AccordionPrimitive.Panel.Props) {
  return <AccordionPrimitive.Panel data-slot="accordion-content" className={cn("px-5 pt-1 pb-4 text-sm leading-relaxed text-[var(--ap-ink-3,#5b6472)]", className)} {...props} />
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
