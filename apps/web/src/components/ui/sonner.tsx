"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { AlertTriangleIcon, CheckIcon, InfoIcon } from "lucide-react"

// Top-right, 340px cards with a tinted round icon (design: Toast, all variants).
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      gap={12}
      offset={{ top: 72, right: 20 }}
      icons={{
        success: <CheckIcon className="size-3.5" />,
        error: <span className="text-[13px] leading-none font-bold">!</span>,
        warning: <AlertTriangleIcon className="size-3.5" />,
        info: <InfoIcon className="size-3.5" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "ap-toast",
          title: "ap-toast__title",
          description: "ap-toast__desc",
          icon: "ap-toast__icon",
          closeButton: "ap-toast__close",
          actionButton: "ap-toast__action",
          cancelButton: "ap-toast__action",
          success: "ap-toast--success",
          error: "ap-toast--error",
          warning: "ap-toast--warning",
          info: "ap-toast--info",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
