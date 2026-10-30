import { useCallback, useEffect, useSyncExternalStore } from 'react'
import '../../app/app-theme.css'

export type ThemePref = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const KEY = 'spectr-app-theme'
const listeners = new Set<() => void>()

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
  } catch { return 'system' }
}

function systemTheme(): ResolvedTheme {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const resolveTheme = (pref: ThemePref): ResolvedTheme => (pref === 'system' ? systemTheme() : pref)

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => { listeners.delete(cb); window.removeEventListener('storage', cb) }
}

function setPref(pref: ThemePref) {
  try { localStorage.setItem(KEY, pref) } catch { /* private mode: keep the in-memory choice for this session */ }
  listeners.forEach((l) => l())
}

/** The user's saved choice (light / dark / follow the OS) and the theme it currently resolves to. */
export function useThemePreference() {
  const pref = useSyncExternalStore(subscribe, readPref, () => 'system' as ThemePref)
  const resolved = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => resolveTheme(readPref()),
    () => 'light' as ResolvedTheme,
  )
  // `resolved` only re-renders on OS changes; derive from `pref` so toggling updates immediately.
  const current: ResolvedTheme = pref === 'system' ? resolved : pref
  const set = useCallback((p: ThemePref) => setPref(p), [])
  return { pref, resolved: current, setPref: set }
}

// The root <html> is `dark` for the marketing site. While the app shell is mounted we apply the app tokens
// (on <html>, so portaled dialogs/menus inherit them): light by default, `ap-dark` + `dark` for the dark theme.
// Everything is restored on unmount.
export function useAppTheme() {
  const { resolved } = useThemePreference()

  useEffect(() => {
    const el = document.documentElement
    const wasDark = el.classList.contains('dark')
    el.classList.add('ap-theme')
    return () => {
      el.classList.remove('ap-theme', 'ap-dark')
      el.classList.toggle('dark', wasDark)
    }
  }, [])

  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('ap-dark', resolved === 'dark')
    el.classList.toggle('dark', resolved === 'dark')
  }, [resolved])
}
