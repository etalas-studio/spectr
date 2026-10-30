'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Plug } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ThemePicker } from '@/components/app/ThemeToggle'
import { Switch } from '@/components/ui/switch'
import { REFRESH_OPTIONS, useRefreshSeconds } from '../prefs'
import { NOTIF_KINDS, useNotifKinds } from '../notifications'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[rgb(var(--ap-ov,0_0_0)/0.1)] bg-[var(--ap-surface,#fff)] px-6 pt-5 pb-3">
      <h2 className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-[var(--ap-ink-4,#6b7280)] uppercase">{title}</h2>
      <div className="divide-y divide-[rgb(var(--ap-ov,0_0_0)/0.08)]">{children}</div>
    </section>
  )
}

function Row({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--ap-ink,#111827)]">{title}</p>
        {sub && <p className="mt-0.5 text-xs text-[var(--ap-ink-3,#5b6472)]">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export default function AdminSettingsPage() {
  const { state, logout } = useAuth()
  const router = useRouter()
  const [refresh, setRefresh] = useRefreshSeconds()
  const [enabledKinds, setKind] = useNotifKinds()
  const [loggingOut, setLoggingOut] = useState(false)

  const username = state.status === 'authenticated' ? (state.username ?? '—') : '—'
  const email = state.status === 'authenticated' ? (state.email ?? '—') : '—'

  const signOut = async () => {
    setLoggingOut(true)
    try { await logout(); router.replace('/login') } finally { setLoggingOut(false) }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-6 pt-2 pb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ap-ink,#111827)]">Settings</h1>
        <p className="mt-1.5 text-sm text-[var(--ap-ink-4,#6b7280)]">Your admin preferences. Saved on this browser.</p>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <div className="max-w-3xl space-y-4">
          <Section title="Appearance">
            <Row title="Theme" sub="Light, dark, or follow your system. Applies to the admin and the user dashboard.">
              <ThemePicker />
            </Row>
          </Section>

          <Section title="Dashboard">
            <Row title="Auto-refresh" sub="How often stats and system health reload while the tab is open.">
              <ToggleGroup value={[String(refresh)]} onValueChange={(v) => { if (v[0] !== undefined) setRefresh(Number(v[0])) }} aria-label="Auto-refresh interval">
                {REFRESH_OPTIONS.map((o) => (
                  <ToggleGroupItem key={o.seconds} value={String(o.seconds)} className="min-w-14">{o.label}</ToggleGroupItem>
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
            <Row title="Sign out" sub="End this session on this browser.">
              <Button variant="destructive" size="sm" className="h-9 rounded-[12px] px-3.5 text-sm font-semibold" disabled={loggingOut} onClick={() => void signOut()}>
                <LogOut /> {loggingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </Row>
          </Section>

          <Section title="System">
            <Row title="AI engine & integrations" sub="Provider keys, models per stage, connection tests.">
              <Link href="/admin/config" className="inline-flex h-9 items-center gap-2 rounded-[12px] bg-[rgb(var(--ap-ov,0_0_0)/0.06)] px-3.5 text-sm font-medium text-[var(--ap-ink,#111827)] transition-colors hover:bg-[rgb(var(--ap-ov,0_0_0)/0.1)]">
                <Plug className="size-4" /> Open Configuration
              </Link>
            </Row>
          </Section>
        </div>
      </div>
    </div>
  )
}
