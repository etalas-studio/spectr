'use client'

import { Crown, HelpCircle, Settings as SettingsIcon, UserCircle, type LucideIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Settings from '../Settings'
import ProfilePage from '../ProfilePage'
import HelpPage from '../HelpPage'
import { UpgradePlan } from './UpgradePlan'

export type AccountTab = 'upgrade' | 'profile' | 'settings' | 'help'

const TABS: { id: AccountTab; label: string; title: string; sub: string; icon: LucideIcon }[] = [
  { id: 'upgrade', label: 'Upgrade Plan', title: 'Upgrade Plan', sub: 'Choose the plan that fits you', icon: Crown },
  { id: 'profile', label: 'Profile', title: 'Profile', sub: 'Your account information', icon: UserCircle },
  { id: 'settings', label: 'Settings', title: 'Settings', sub: 'Manage your preferences', icon: SettingsIcon },
  { id: 'help', label: 'Help', title: 'Help & Docs', sub: 'Spectr usage guide', icon: HelpCircle },
]

export function AccountDialog({ tab, onTabChange, onClose }: { tab: AccountTab | null; onTabChange: (t: AccountTab) => void; onClose: () => void }) {
  const current = TABS.find((t) => t.id === tab) ?? TABS[1]
  return (
    <Dialog open={tab !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton
        closeClassName="top-6 right-5"
        className="h-[min(740px,86vh)] max-w-[calc(100%-2rem)] grid-cols-1 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[920px] md:grid-cols-[232px_1fr]"
      >
        <nav aria-label="Account" className="hidden flex-col gap-1 border-r bg-[#f7f8fa] p-3 md:flex">
          {TABS.map((t) => (
            <Button
              key={t.id}
              variant="nav"
              aria-current={t.id === current.id ? 'page' : undefined}
              onClick={() => onTabChange(t.id)}
            >
              <t.icon className="size-4" /> {t.label}
            </Button>
          ))}
        </nav>
        <div className="flex min-h-0 min-w-0 flex-col">
          {/* Mobile tab strip */}
          <div className="flex gap-1 overflow-x-auto border-b p-2 md:hidden">
            {TABS.map((t) => (
              <Button key={t.id} variant="nav" className="w-auto shrink-0" aria-current={t.id === current.id ? 'page' : undefined} onClick={() => onTabChange(t.id)}>{t.label}</Button>
            ))}
          </div>
          <header className="shrink-0 px-6 pt-6 pb-4">
            <DialogTitle className="text-xl leading-7 font-semibold tracking-tight">{current.title}</DialogTitle>
            <DialogDescription className="mt-0.5 text-[13px] text-gray-500">{current.sub}</DialogDescription>
          </header>
          <div className="ap-scroll min-h-0 flex-1 overflow-y-auto">
            {current.id === 'upgrade' && <UpgradePlan onNavigate={onClose} />}
            {current.id === 'profile' && <ProfilePage />}
            {current.id === 'settings' && <Settings onUpgrade={() => onTabChange('upgrade')} />}
            {current.id === 'help' && <HelpPage />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function UpgradeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent closeClassName="top-6 right-5" className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[480px]">
        <header className="shrink-0 border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-xl leading-7 font-semibold tracking-tight">Upgrade Plan</DialogTitle>
          <DialogDescription className="mt-0.5 text-[13px] text-gray-500">Choose the plan that fits you</DialogDescription>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto pt-5"><UpgradePlan onNavigate={onClose} /></div>
      </DialogContent>
    </Dialog>
  )
}

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent closeClassName="top-6 right-5" className="flex max-h-[86vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[560px]">
        <header className="shrink-0 border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-xl leading-7 font-semibold tracking-tight">Help &amp; Docs</DialogTitle>
          <DialogDescription className="mt-0.5 text-[13px] text-gray-500">Spectr usage guide</DialogDescription>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto pt-4"><HelpPage /></div>
      </DialogContent>
    </Dialog>
  )
}
