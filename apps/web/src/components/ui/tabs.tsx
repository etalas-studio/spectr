"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("relative inline-flex w-fit items-center gap-0.5 rounded-2xl bg-[rgb(var(--ap-ov,0_0_0)/0.06)] p-1", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-10 cursor-pointer items-center justify-center gap-2 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 rounded-[12px] px-5 text-sm font-medium text-[var(--ap-ink-2,#374151)] transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 data-active:bg-[var(--ap-surface,#fff)] data-active:text-foreground data-active:shadow-[0_1px_3px_rgba(17,24,39,0.12)]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
