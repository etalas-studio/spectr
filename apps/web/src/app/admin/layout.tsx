'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import { useAuth } from '../../hooks/useAuth'

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'solar:widget-2-linear' },
  { href: '/admin/users', label: 'Users', icon: 'solar:users-group-rounded-linear' },
  { href: '/admin/payments', label: 'Payments', icon: 'solar:card-linear' },
  { href: '/admin/config', label: 'Configuration', icon: 'solar:settings-linear' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { state, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768)

  useEffect(() => {
    if (!isLoading && state.status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [isLoading, state.status, router])

  if (isLoading || state.status !== 'authenticated') {
    return <div className="min-h-screen bg-neutral-950" />
  }

  if (state.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Forbidden — admin only.
      </div>
    )
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      router.replace('/login')
    } finally {
      setLoggingOut(false)
    }
  }

  const username = state.username ?? state.email ?? '?'
  const initial = username.charAt(0).toUpperCase()

  return (
    <Theme accentColor="blue" grayColor="slate" appearance="light" radius="medium" style={{ '--accent-9': '#3b82f6', '--accent-10': '#2563eb', '--accent-a9': '#3b82f6cc' } as React.CSSProperties}>
    <div className="flex h-screen overflow-hidden text-neutral-800" style={{ backgroundColor: '#f8fafc' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {sidebarOpen && (
      <aside className="flex h-screen w-60 shrink-0 flex-col border-r px-3 py-5" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}>
        {/* Brand */}
        <div className="mb-7 px-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Spectr" className="h-6 w-auto brightness-0" />
            <div>
              <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#111827', fontFamily: "'Instrument Serif', serif" }}>
                Spectr
              </span>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.35)' }}>
                Admin
              </div>
            </div>
          </div>
          <button
            className="p-1 rounded transition-colors hover:bg-black/5"
            onClick={() => setSidebarOpen(false)}
            aria-label="Collapse sidebar"
          >
            <iconify-icon icon="solar:sidebar-minimalistic-linear" width="18" style={{ color: 'rgba(0,0,0,0.4)' }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="px-3 mb-1 text-[11px] font-medium tracking-wide" style={{ color: 'rgba(0,0,0,0.3)' }}>Manage</span>
            {NAV.map(({ href, label, icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
                  style={active
                    ? { backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 500 }
                    : { color: '#374151' }
                  }
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '' }}
                >
                  <iconify-icon icon={icon} width="16" />
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="flex flex-col">
            <span className="px-3 mb-1 text-[11px] font-medium tracking-wide" style={{ color: 'rgba(0,0,0,0.3)' }}>View</span>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
              style={{ color: '#374151' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.06)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '' }}
            >
              <iconify-icon icon="solar:eye-linear" width="16" />
              User Dashboard
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
              style={{ color: '#374151' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.06)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '' }}
            >
              <iconify-icon icon="solar:home-2-linear" width="16" />
              Landing Page
            </Link>
          </div>
        </nav>

        {/* Bottom: user pill */}
        <div className="mt-auto border-t pt-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>

          {/* User pill */}
          <button
            onClick={() => setShowAccountMenu(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
            style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)')}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#3b82f6' }}>
              {initial}
            </div>
            <p className="text-xs font-medium truncate" style={{ color: '#111827' }}>{username}</p>
          </button>

          {showAccountMenu && (
            <div className="fixed inset-0 z-50" onClick={() => setShowAccountMenu(false)}>
              <style>{`@keyframes slideUp { from { transform: translateY(4px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
              <div
                className="absolute bottom-16 left-3 w-[200px] rounded-xl overflow-hidden"
                style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', animation: 'slideUp 0.15s ease-out', boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <p className="text-sm font-semibold" style={{ color: '#111827' }}>{username}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>{state.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setShowAccountMenu(false); void handleLogout() }}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left disabled:opacity-50"
                    style={{ color: '#f87171' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <iconify-icon icon="solar:logout-2-linear" width="15" />
                    {loggingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        {!sidebarOpen && (
          <button
            className="m-4 p-1.5 rounded-lg hover:bg-black/8 transition-colors self-start"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <iconify-icon icon="solar:hamburger-menu-linear" width="20" style={{ color: 'rgba(0,0,0,0.5)' }} />
          </button>
        )}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
    </Theme>
  )
}
