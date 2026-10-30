'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Plug } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ThemePicker } from '@/components/app/ThemeToggle'
import { REFRESH_OPTIONS, useRefreshSeconds } from './prefs'
import { NOTIF_KINDS, useNotifKinds } from './notifications'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border bg-[var(--ap-surface,#fff)] px-6 pt-5 pb-3">
      <h3 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--ap-ink-4,#6b7280)] uppercase">{title}</h3>
      <div className="divide-y divide-[rgb(var(--ap-ov,0_0_0)/0.06)]">{children}</div>
    </section>
  )
}

function Row({ title, sub, children, stack }: { title: string; sub?: string; children: ReactNode; stack?: boolean }) {
  return (
    <div className={`flex min-h-[46px] gap-4 py-3 ${stack ? 'flex-col items-start' : 'items-center justify-between'}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {sub && <p className="mt-0.5 text-xs text-[var(--ap-ink-4,#6b7280)]">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function SettingsBody({ onClose }: { onClose: () => void }) {
  const { state } = useAuth()
  const [refresh, setRefresh] = useRefreshSeconds()
  const [enabledKinds, setKind] = useNotifKinds()
  const username = state.status === 'authenticated' ? (state.username ?? '—') : '—'
  const email = state.status === 'authenticated' ? (state.email ?? '—') : '—'

  return (
    <div className="px-6 pt-2 pb-6">
      <Section title="Appearance">
        <Row stack title="Theme" sub="Light, dark, or follow your system. Applies to the admin and the user dashboard.">
          <ThemePicker />
        </Row>
      </Section>

      <Section title="Dashboard">
        <Row stack title="Auto-refresh" sub="How often stats and system health reload while the tab is open.">
          <ToggleGroup value={[String(refresh)]} onValueChange={(v) => { if (v[0] !== undefined) setRefresh(Number(v[0])) }} aria-label="Auto-refresh interval">
            {REFRESH_OPTIONS.map((o) => (
              <ToggleGroupItem key={o.seconds} value={String(o.seconds)}>{o.label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Row>
      </Section>

      <Section title="Notifications">
        {NOTIF_KINDS.map((k) => (
          <Row key={k.kind} title={k.label} sub={k.sub}>
            <Switch checked={enabledKinds.includes(k.kind)} onCheckedChange={(on) => setKind(k.kind, on)} aria-label={k.label} />
          </Row>
        ))}
      </Section>

      <Section title="Account">
        <Row title="Username"><span className="text-sm text-[var(--ap-ink-2,#374151)]">{username}</span></Row>
        <Row title="Email"><span className="text-sm text-[var(--ap-ink-2,#374151)]">{email}</span></Row>
        <Row title="Role"><Badge tone="blue">admin</Badge></Row>
      </Section>

      <Section title="System">
        <Row title="AI engine & integrations" sub="Provider keys, models per stage, connection tests.">
          <Link href="/admin/config" onClick={onClose} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[12px] bg-[rgb(var(--ap-ov,0_0_0)/0.06)] px-3.5 text-sm font-medium transition-colors hover:bg-[rgb(var(--ap-ov,0_0_0)/0.1)]">
            <Plug className="size-4" /> Configuration
          </Link>
        </Row>
      </Section>
    </div>
  )
}

export function AdminSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent closeClassName="top-6 right-5" className="flex max-h-[86vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[560px]">
        <header className="shrink-0 border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-xl leading-7 font-semibold tracking-tight">Settings</DialogTitle>
          <DialogDescription className="mt-0.5 text-[13px] text-[var(--ap-ink-3,#5b6472)]">Your admin preferences. Saved on this browser.</DialogDescription>
        </header>
        <div className="ap-scroll min-h-0 flex-1 overflow-y-auto pt-4"><SettingsBody onClose={onClose} /></div>
      </DialogContent>
    </Dialog>
  )
}
