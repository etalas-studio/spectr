import { useSyncExternalStore } from 'react'

const KEY = 'spectr-admin-refresh'
const DEFAULT_SECONDS = 30
export const REFRESH_OPTIONS = [
  { seconds: 0, label: 'Off' },
  { seconds: 15, label: '15s' },
  { seconds: 30, label: '30s' },
  { seconds: 60, label: '60s' },
] as const

const listeners = new Set<() => void>()
function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => { listeners.delete(cb); window.removeEventListener('storage', cb) }
}
function read(): number {
  try {
    const n = Number(localStorage.getItem(KEY))
    return localStorage.getItem(KEY) !== null && REFRESH_OPTIONS.some((o) => o.seconds === n) ? n : DEFAULT_SECONDS
  } catch { return DEFAULT_SECONDS }
}

/** How often (seconds) the admin dashboard re-fetches its stats and health checks. 0 = manual only. */
export function useRefreshSeconds(): [number, (s: number) => void] {
  const seconds = useSyncExternalStore(subscribe, read, () => DEFAULT_SECONDS)
  const set = (s: number) => {
    try { localStorage.setItem(KEY, String(s)) } catch { /* keep the default for this session */ }
    listeners.forEach((l) => l())
  }
  return [seconds, set]
}
