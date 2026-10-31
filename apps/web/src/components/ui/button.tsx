import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[12px] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        primary:
          "border-0 bg-linear-to-b from-[#2f6df0] to-[#1d4ed8] text-white shadow-[0_4px_10px_rgba(38,94,228,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-105 disabled:opacity-45 data-[send]:disabled:opacity-100",
        pill:
          "border-[rgb(var(--ap-ov,0_0_0)/0.08)] bg-[var(--ap-surface,#fff)] text-[var(--ap-ink-2,#374151)] shadow-[0_1px_2px_rgba(17,24,39,0.04)] hover:bg-[var(--ap-surface,#fff)]",
        glass:
          "border-[var(--ap-edge,rgba(255,255,255,.95))] bg-[var(--ap-surface,#fff)] text-[var(--ap-ink-2,#374151)] shadow-[0_1px_2px_rgba(17,24,39,0.06)] hover:bg-[var(--ap-surface,#fff)] aria-expanded:bg-[var(--ap-surface,#fff)]",
        nav:
          "h-auto w-full justify-start gap-3 px-3 py-2.5 font-normal text-[var(--ap-ink-2,#374151)] hover:bg-[rgb(var(--ap-ov,0_0_0)/0.04)] aria-[current=page]:bg-[rgba(38,94,228,0.14)] aria-[current=page]:font-semibold aria-[current=page]:text-[var(--ap-accent-ink,#1e40af)] aria-[current=page]:shadow-[inset_0_0_0_1px_rgba(38,94,228,0.18)]",
        row:
          "h-9 w-full justify-start gap-2 px-2 text-xs font-normal text-[var(--ap-ink-3,#5b6472)] hover:bg-[rgb(var(--ap-ov,0_0_0)/0.04)] aria-[current=true]:bg-[rgba(38,94,228,0.12)] aria-[current=true]:font-medium aria-[current=true]:text-[var(--ap-accent-ink,#1e40af)]",
        field:
          "h-10 w-full justify-start gap-2 border-[rgb(var(--ap-ov,0_0_0)/0.08)] bg-[rgb(var(--ap-ov,0_0_0)/0.03)] px-3 font-normal text-[var(--ap-ink-3,#5b6472)] hover:bg-[rgb(var(--ap-ov,0_0_0)/0.05)]",
        card:
          "relative h-auto w-full flex-col items-stretch justify-start gap-3.5 overflow-hidden whitespace-normal border-[rgb(var(--ap-ov,0_0_0)/0.08)] bg-[var(--ap-surface,#fff)] p-4 text-left font-normal shadow-[0_1px_2px_rgba(17,24,39,0.04)] hover:bg-[var(--ap-surface,#fff)] active:translate-y-0",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[12px] px-2 text-xs in-data-[slot=button-group]:rounded-[12px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[12px] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-[12px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[12px] in-data-[slot=button-group]:rounded-[12px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[12px] in-data-[slot=button-group]:rounded-[12px]",
        "icon-lg": "size-9",
        "icon-xl": "size-10",
        send: "size-9 rounded-full",
      },
    },
    compoundVariants: [
      { variant: "nav", size: "default", class: "h-auto gap-3 px-3 py-2.5 text-left" },
      { variant: "row", size: "default", class: "h-9 gap-1.5 px-2 text-left" },
      { variant: "field", size: "default", class: "h-10 gap-2 px-3 text-left" },
      { variant: "card", size: "default", class: "h-auto gap-3.5 p-4 text-left" },
      { variant: "pill", size: "default", class: "h-10 gap-2 px-4" },
      { variant: "glass", size: "default", class: "h-10 gap-2 px-3.5" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
