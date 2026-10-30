'use client'

import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAdminNotifications, type NotifTone } from './notifications'

const TONE: Record<NotifTone, { icon: typeof Bell; cls: string }> = {
  red: { icon: CircleAlert, cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
  amber: { icon: TriangleAlert, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  green: { icon: CircleCheck, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
}

function timeAgo(iso?: string): string {
  if (!iso) return ''
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, secs] of [['day', 86400], ['hour', 3600], ['minute', 60]] as const) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return 'just now'
}

export function AdminNotifications() {
  const router = useRouter()
  const { items, unread, isRead, markRead, markAllRead } = useAdminNotifications()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'} render={<Button variant="glass" size="icon-xl" className="relative" />}>
        <Bell className="size-[18px]" />
        {unread > 0 && <Badge className="absolute top-2 right-2.5 size-2 bg-primary p-0 ring-2 ring-[var(--ap-surface,#fff)]" aria-hidden="true" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 rounded-[14px] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            Notifications
            {unread > 0 && <Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] text-white">{unread}</Badge>}
          </span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs text-primary" onClick={markAllRead}>
              <CheckCheck className="size-3.5" /> Mark all read
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-[rgb(var(--ap-ov,0_0_0)/0.06)] text-[var(--ap-ink-4,#6b7280)]"><Bell className="size-[18px]" /></span>
            <p className="text-sm text-[var(--ap-ink-3,#5b6472)]">You&apos;re all caught up.</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto p-1.5">
            {items.map((n) => {
              const { icon: Icon, cls } = TONE[n.tone]
              const unreadItem = !isRead(n.id)
              return (
                <DropdownMenuItem key={n.id} onClick={() => { markRead(n.id); router.push(n.href) }} className="h-auto items-start gap-3 rounded-[10px] px-2.5 py-2.5">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${cls}`}><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${unreadItem ? 'font-semibold' : 'font-medium'}`}>{n.title}</span>
                    <span className="block text-xs break-words text-[var(--ap-ink-3,#5b6472)]">{n.detail}</span>
                    {n.at && <span className="mt-0.5 block text-[11px] text-[var(--ap-ink-4,#6b7280)]">{timeAgo(n.at)}</span>}
                  </span>
                  {unreadItem && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                </DropdownMenuItem>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
