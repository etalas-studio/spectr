import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { fetchAdminHealth, fetchAdminStats, type AdminHealth, type AdminStats } from '../../api/admin'
import { useRefreshSeconds } from './prefs'

export type NotifKind = 'health' | 'payments' | 'subscriptions'
export type NotifTone = 'red' | 'amber' | 'green'

export interface AdminNotification {
  id: string
  kind: NotifKind
  tone: NotifTone
  title: string
  detail: string
  at?: string
  href: string
}

export const NOTIF_KINDS: { kind: NotifKind; label: string; sub: string }[] = [
  { kind: 'health', label: 'System health', sub: 'When a health check is degraded or down' },
  { kind: 'payments', label: 'Payments', sub: 'Settled and failed payments from the last 7 days' },
  { kind: 'subscriptions', label: 'Subscriptions', sub: 'Pro subscriptions expiring within 7 days' },
]

const WEEK_MS = 7 * 24 * 3600 * 1000
const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

/** Pure: turns the latest stats + health report into the notification list (newest/most urgent first). */
export function buildNotifications(stats: AdminStats | null, health: AdminHealth | null, now = Date.now()): AdminNotification[] {
  const out: AdminNotification[] = []

  if (health && health.status !== 'ok') {
    const bad = health.checks.filter((c) => c.status !== 'ok')
    out.push({
      id: `health:${health.status}:${bad.map((c) => c.id).join(',')}`,
      kind: 'health',
      tone: health.status === 'down' ? 'red' : 'amber',
      title: health.status === 'down' ? 'System is down' : 'System degraded',
      detail: bad.map((c) => `${c.name}: ${c.detail}`).join(' · '),
      href: '/admin/dashboard',
    })
  }

  if (stats && stats.expiringSubsCount > 0) {
    const day = new Date(now).toISOString().slice(0, 10)
    const n = stats.expiringSubsCount
    out.push({
      id: `subs:${n}:${day}`,
      kind: 'subscriptions',
      tone: 'amber',
      title: `${n} subscription${n > 1 ? 's' : ''} expiring soon`,
      detail: 'Pro plans that end within 7 days.',
      href: '/admin/users',
    })
  }

  if (stats) {
    for (const p of stats.recentPayments) {
      if (p.status === 'pending') continue
      const ts = new Date(p.createdAt).getTime()
      if (now - ts > WEEK_MS) continue
      const who = p.userEmail ?? 'Unknown user'
      out.push({
        id: `pay:${p.orderId}:${p.status}`,
        kind: 'payments',
        tone: p.status === 'settled' ? 'green' : 'red',
        title: p.status === 'settled' ? 'Payment received' : 'Payment failed',
        detail: `${who} · ${rupiah(Number(p.grossAmount))}${p.planSlug ? ` · ${p.planSlug}` : ''}`,
        at: p.createdAt,
        href: '/admin/payments',
      })
    }
  }

  const urgency: Record<NotifTone, number> = { red: 0, amber: 1, green: 2 }
  return out.sort((a, b) => urgency[a.tone] - urgency[b.tone] || (b.at ?? '').localeCompare(a.at ?? ''))
}

// ── Local prefs: which kinds are enabled + which notification ids were read ─────────────────
const ENABLED_KEY = 'spectr-admin-notif-kinds'
const READ_KEY = 'spectr-admin-notif-read'
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => { listeners.delete(cb); window.removeEventListener('storage', cb) }
}
function readJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode: not persisted */ }
  emit()
}

// useSyncExternalStore needs a referentially stable snapshot, so cache the raw string.
function useStored<T>(key: string, fallback: T): T {
  const raw = useSyncExternalStore(
    subscribe,
    () => { try { return localStorage.getItem(key) ?? '' } catch { return '' } },
    () => '',
  )
  return useMemo(() => { try { return raw ? (JSON.parse(raw) as T) : fallback } catch { return fallback } }, [raw, fallback])
}

const ALL_KINDS: NotifKind[] = ['health', 'payments', 'subscriptions']
const NO_READ: string[] = []

export function useNotifKinds(): [NotifKind[], (kind: NotifKind, on: boolean) => void] {
  const enabled = useStored<NotifKind[]>(ENABLED_KEY, ALL_KINDS)
  const set = (kind: NotifKind, on: boolean) => {
    const cur = readJson<NotifKind[]>(ENABLED_KEY, ALL_KINDS)
    writeJson(ENABLED_KEY, on ? Array.from(new Set([...cur, kind])) : cur.filter((k) => k !== kind))
  }
  return [enabled, set]
}

/** Live admin notifications, derived from the same stats + health endpoints the dashboard uses. */
export function useAdminNotifications() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [health, setHealth] = useState<AdminHealth | null>(null)
  const [refreshSeconds] = useRefreshSeconds()
  const [enabled] = useNotifKinds()
  const read = useStored<string[]>(READ_KEY, NO_READ)

  const load = useCallback(async () => {
    const [s, h] = await Promise.allSettled([fetchAdminStats(), fetchAdminHealth()])
    if (s.status === 'fulfilled') setStats(s.value)
    if (h.status === 'fulfilled') setHealth(h.value)
  }, [])

  useEffect(() => {
    void load()
    const tick = () => { if (document.visibilityState === 'visible') void load() }
    // Honour the dashboard refresh setting; when it is Off still check once a minute so alerts are not missed.
    const id = setInterval(tick, (refreshSeconds > 0 ? refreshSeconds : 60) * 1000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [load, refreshSeconds])

  const items = useMemo(() => buildNotifications(stats, health).filter((n) => enabled.includes(n.kind)), [stats, health, enabled])
  const readSet = useMemo(() => new Set(read), [read])
  const unread = items.filter((n) => !readSet.has(n.id)).length

  const markRead = useCallback((id: string) => {
    const cur = readJson<string[]>(READ_KEY, NO_READ)
    if (!cur.includes(id)) writeJson(READ_KEY, [...cur, id].slice(-200))
  }, [])
  const markAllRead = useCallback(() => {
    const cur = readJson<string[]>(READ_KEY, NO_READ)
    writeJson(READ_KEY, Array.from(new Set([...cur, ...items.map((n) => n.id)])).slice(-200))
  }, [items])

  return { items, unread, isRead: (id: string) => readSet.has(id), markRead, markAllRead }
}
