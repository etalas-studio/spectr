'use client'

import { useState } from 'react'
import { Bell, CheckCheck, ChevronDown, CircleHelp, Crown, FileText, LayoutTemplate, LogOut, MessageCircle, PanelLeft, Settings } from 'lucide-react'
import { useLanguage } from '../../lib/i18n'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { LocalConversation } from '../../lib/conversations'

export interface TopbarProps {
  title: string
  sidebarOpen: boolean
  onOpenSidebar: () => void
  username: string
  plan: string
  notifications: LocalConversation[]
  noNotificationsLabel: string
  finishedLabel: string
  notificationsTitle: string
  markAllReadLabel: string
  onMarkAllRead: () => void
  onOpenNotification: (c: LocalConversation) => void
  onHelp: () => void
  onSettings: () => void
  onSignOut: () => void
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]]
function timeAgo(iso: string | undefined, lang: string): string {
  if (!iso) return ''
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  for (const [unit, secs] of UNITS) if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  return rtf.format(0, 'second')
}

function NotifIcon({ type }: { type: string }) {
  const Icon = type === 'prototype' ? LayoutTemplate : type === 'general' ? MessageCircle : FileText
  return <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></span>
}

/** Avatar with a small yellow crown perched on it for Pro accounts. */
function PlanAvatar({ username, isPro, className = '' }: { username: string; isPro: boolean; className?: string }) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <Avatar><AvatarFallback className="text-sm">{username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
      {isPro && (
        <Crown
          className="absolute -top-2 -right-1.5 size-4 rotate-[18deg] text-amber-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
          fill="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
    </span>
  )
}

function PlanBadge({ isPro, plan }: { isPro: boolean; plan: string }) {
  return isPro ? (
    <Badge className="gap-1 bg-amber-100 px-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/20 dark:text-amber-300">
      <Crown className="size-3 text-amber-500 dark:text-amber-400" fill="currentColor" aria-hidden="true" /> Pro
    </Badge>
  ) : (
    <Badge tone="gray" className="px-2 text-[11px]">{plan}</Badge>
  )
}

export function Topbar(p: TopbarProps) {
  const isPro = p.plan.toLowerCase() === 'pro'
  const { lang } = useLanguage()
  const [notifOpen, setNotifOpen] = useState(false)
  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center gap-2 px-4 sm:gap-3 sm:px-6">
      {!p.sidebarOpen && (
        <Button variant="ghost" size="icon" onClick={p.onOpenSidebar} aria-label="Open sidebar" className="-ml-2 text-[var(--ap-ink-3,#5b6472)]"><PanelLeft /></Button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-lg leading-7 font-semibold tracking-[-0.025em]">{p.title}</h1>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="glass" size="icon-xl" className="max-sm:hidden" onClick={p.onHelp} aria-label="Help"><CircleHelp className="size-[18px]" /></Button>

        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger aria-label="Notifications" render={<Button variant="glass" size="icon-xl" className="relative" />}>
            <Bell className="size-[18px]" />
            {p.notifications.length > 0 && <Badge className="absolute top-2 right-2.5 size-2 bg-primary p-0 ring-2 ring-[var(--ap-edge,rgba(255,255,255,.95))]" aria-hidden="true" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-[14px] p-0">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                {p.notificationsTitle}
                {p.notifications.length > 0 && <Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] text-white">{p.notifications.length}</Badge>}
              </span>
              {p.notifications.length > 0 && (
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs text-primary" onClick={() => { p.onMarkAllRead(); setNotifOpen(false) }}>
                  <CheckCheck className="size-3.5" /> {p.markAllReadLabel}
                </Button>
              )}
            </div>
            {p.notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-[rgb(var(--ap-ov,0_0_0)/0.05)] text-[var(--ap-ink-4,#6b7280)]"><Bell className="size-[18px]" /></span>
                <p className="text-sm text-[var(--ap-ink-3,#5b6472)]">{p.noNotificationsLabel}</p>
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto p-1.5">
                {p.notifications.map((n) => (
                  <DropdownMenuItem key={n.id} onClick={() => p.onOpenNotification(n)} className="h-auto items-start gap-3 rounded-[10px] px-2.5 py-2.5">
                    <NotifIcon type={n.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{n.summary}</span>
                      <span className="block text-xs text-[var(--ap-ink-4,#6b7280)]">{p.finishedLabel}{n.updatedAt ? ` · ${timeAgo(n.updatedAt, lang)}` : ''}</span>
                    </span>
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Account menu" render={<Button variant="ghost" className="h-10 gap-2.5 py-1 pr-2 pl-1 hover:bg-[rgb(var(--ap-surf-rgb,255_255_255)/0.6)]" />}>
            <PlanAvatar username={p.username} isPro={isPro} />
            <span className="hidden max-w-[160px] truncate text-sm font-medium sm:block">{p.username}</span>
            <ChevronDown className="hidden size-3.5 text-[var(--ap-ink-4,#6b7280)] sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
            <div className="flex items-center gap-3 px-2 py-2">
              <PlanAvatar username={p.username} isPro={isPro} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{p.username}</span>
                <span className="mt-1 block"><PlanBadge isPro={isPro} plan={p.plan} /></span>
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={p.onSettings} className="h-9"><Settings /> Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={p.onSignOut} variant="destructive" className="h-9"><LogOut /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
