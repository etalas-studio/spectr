'use client'

import { TileGrid } from '@/components/app/TileGrid'
import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, CreditCard, Eye, Home, LayoutDashboard, LogOut, PanelLeft, Settings, UsersRound, type LucideIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAppTheme } from '../../components/app/useAppTheme'
import { BrandMark } from '../../components/app/BrandMark'
import { Button } from '../../components/ui/button'
import { Toaster } from '../../components/ui/sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: UsersRound },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/config', label: 'Configuration', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useAppTheme()
  const { state, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768)

  useEffect(() => {
    if (!isLoading && state.status === 'unauthenticated') router.replace('/login')
  }, [isLoading, state.status, router])

  if (isLoading || state.status !== 'authenticated') return <div className="min-h-screen bg-white" />

  if (state.role !== 'admin') {
    return <div className="flex min-h-screen items-center justify-center bg-white text-gray-500">Forbidden — admin only.</div>
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try { await logout(); router.replace('/login') } finally { setLoggingOut(false) }
  }

  const username = state.username ?? state.email ?? '?'
  const initial = username.charAt(0).toUpperCase()
  const current = NAV.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))

  return (
    <>
      <div className="ap-root flex h-dvh overflow-hidden">
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-white md:static md:z-auto" aria-label="Admin sidebar">
              <div className="flex items-center justify-between px-4 pt-5 pb-4">
                <div className="flex items-center gap-2.5">
                  <BrandMark />
                  <div className="leading-tight">
                    <span className="block text-sm font-semibold tracking-[0.18em] uppercase">Spectr</span>
                    <span className="block text-[10px] tracking-[0.14em] text-black/40 uppercase">Admin</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar" className="text-black/40"><PanelLeft /></Button>
              </div>

              <nav className="flex flex-col gap-5 px-3 pt-3" aria-label="Admin">
                <div>
                  <p className="ap-label">Manage</p>
                  {NAV.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} className="ap-nav mb-0.5" aria-current={pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined}>
                      <Icon className="size-4" /> {label}
                    </Link>
                  ))}
                </div>
                <div>
                  <p className="ap-label">View</p>
                  <Link href="/dashboard" className="ap-nav mb-0.5"><Eye className="size-4" /> User Dashboard</Link>
                  <Link href="/" className="ap-nav"><Home className="size-4" /> Landing Page</Link>
                </div>
              </nav>
            </aside>
          </>
        )}

        <div className="ap-main" id="main">
          <TileGrid />
          <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 px-6">
            {!sidebarOpen && <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar" className="-ml-2 text-gray-500"><PanelLeft /></Button>}
            <h1 className="sr-only">{current?.label ?? 'Admin'}</h1>
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-10 items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-white/60" aria-label="Account menu">
                <span className="ap-avatar size-9 text-sm">{initial}</span>
                <span className="hidden max-w-[160px] truncate text-sm font-medium sm:block">{username}</span>
                <ChevronDown className="hidden size-3.5 text-gray-400 sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                <div className="px-2 py-2">
                  <p className="truncate text-sm font-semibold">{username}</p>
                  <p className="truncate text-xs text-gray-500">{state.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled={loggingOut} onClick={() => void handleLogout()} className="h-9"><LogOut /> {loggingOut ? 'Signing out…' : 'Sign out'}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <div className="ap-scroll relative z-[1] min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
      <Toaster />
    </>
  )
}
