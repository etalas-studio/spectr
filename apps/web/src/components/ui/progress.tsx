"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@/lib/utils"

/** Segmented progress bar: `segments` rounded bars, the first `value/max` of them filled. */
function SegmentedProgress({ className, segments = 20, value, max = 100, ...props }: Omit<ProgressPrimitive.Root.Props, "children"> & { segments?: number }) {
  const filled = Math.round(((value ?? 0) / max) * segments)
  return (
    <ProgressPrimitive.Root data-slot="progress" value={value} max={max} className={cn("flex h-5 gap-1", className)} {...props}>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={cn("flex-1 rounded-[4px]", i < filled ? "bg-linear-to-b from-[#2f6df0] to-[#1d4ed8]" : "bg-[rgb(var(--ap-ov,0_0_0)/0.08)]")} />
      ))}
    </ProgressPrimitive.Root>
  )
}

export { SegmentedProgress }
