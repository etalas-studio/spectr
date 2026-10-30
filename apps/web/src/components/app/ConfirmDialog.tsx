'use client'

import { Trash2, LogOut, X, type LucideIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function ConfirmDialog({
  open, onOpenChange, title, message, confirmLabel, cancelLabel = 'Cancel', onConfirm, icon: Icon = Trash2,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  icon?: LucideIcon
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeClassName="top-[30px] right-5" className="gap-0 rounded-2xl p-6 sm:max-w-[420px]">
        <Badge className="size-10 justify-center rounded-full bg-red-100 p-0 text-red-500"><Icon className="size-[18px]" /></Badge>
        <DialogTitle className="mt-4 text-lg leading-7 font-semibold tracking-tight">{title}</DialogTitle>
        <DialogDescription className="mt-1 text-sm leading-5 text-gray-500">{message}</DialogDescription>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" className="h-10 gap-2 rounded-[12px] px-4 bg-black/[0.06] font-semibold text-gray-700 hover:bg-black/[0.1]" onClick={() => onOpenChange(false)}><X /> {cancelLabel}</Button>
          <Button className="h-10 gap-2 rounded-[12px] px-4 bg-[#dc2626] font-semibold text-white hover:bg-[#b91c1c]" onClick={() => { onConfirm(); onOpenChange(false) }}><Icon /> {confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { LogOut as SignOutIcon }
