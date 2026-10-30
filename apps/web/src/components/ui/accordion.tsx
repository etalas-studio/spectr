"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot="accordion" className={cn("flex flex-col gap-1.5", className)} {...props} />
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("overflow-hidden rounded-xl border bg-white", className)} {...props} />
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn("group/trigger flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-sm font-medium transition-colors outline-none hover:bg-black/[0.02] focus-visible:ring-3 focus-visible:ring-ring/40 data-panel-open:bg-primary/[0.04]", className)}
        {...props}
      >
        {children}
        <ChevronDown className="size-3.5 shrink-0 text-black/30 transition-transform group-data-panel-open/trigger:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, ...props }: AccordionPrimitive.Panel.Props) {
  return <AccordionPrimitive.Panel data-slot="accordion-content" className={cn("px-5 pt-1 pb-4 text-sm leading-relaxed text-gray-500", className)} {...props} />
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
