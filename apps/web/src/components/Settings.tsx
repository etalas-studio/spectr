'use client'
import { useState, type ReactNode } from 'react'
import { useLanguage, type Lang } from '../lib/i18n'
import { useSubscription } from '../hooks/useSubscription'
import { Crown, Settings2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border bg-white px-6 pt-5 pb-3">
      <h3 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-gray-400 uppercase">{title}</h3>
      <div className="divide-y divide-black/[0.06]">{children}</div>
    </section>
  )
}

function Row({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[46px] items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null)

export default function Settings({ onUpgrade }: { onUpgrade?: () => void }) {
  const { lang, setLang } = useLanguage()
  const L = (en: string, id: string) => (lang === 'id' ? id : en)
  const { data: sub } = useSubscription()
  const isPro = sub?.planSlug === 'pro'
  const expiresAt = fmt(sub?.expiresAt)
  const startedAt = fmt(sub?.startedAt)

  const [emailNotif, setEmailNotif] = useState(true)
  const [docDoneNotif, setDocDoneNotif] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  return (
    <div className="px-6 pt-2 pb-6">
      <Section title="Subscription">
        <Row title="Current plan">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isPro ? 'bg-primary/10 text-primary' : 'bg-black/[0.06] text-gray-500'}`}>{isPro ? 'Pro' : 'Starter'}</span>
        </Row>
        {startedAt && <Row title="Started"><span className="text-sm text-gray-500">{startedAt}</span></Row>}
        {(isPro || expiresAt) && (
          <Row title={sub?.expired ? 'Expired' : 'Renews'}>
            <span className={`text-sm ${sub?.expired ? 'text-destructive' : 'text-gray-500'}`}>{expiresAt ?? '—'}</span>
          </Row>
        )}
        <Row title={isPro ? 'Manage plan' : 'Upgrade to Pro'} sub={isPro ? 'Change or cancel your subscription' : 'Unlock unlimited documents & AI chat'}>
          <Button size="sm" variant="primary" className="h-8 px-3 text-xs font-semibold" onClick={onUpgrade}>{isPro ? <Settings2 /> : <Crown />} {isPro ? 'Manage' : 'Upgrade'}</Button>
        </Row>
      </Section>

      <section className="mb-4 rounded-2xl border bg-white p-6">
        <h3 className="mb-4 text-[11px] font-semibold tracking-[0.08em] text-gray-400 uppercase">{L('Language', 'Bahasa')}</h3>
        <ToggleGroup value={[lang]} onValueChange={(v) => { if (v[0]) setLang(v[0] as Lang) }}>
          <ToggleGroupItem value="en">English</ToggleGroupItem>
          <ToggleGroupItem value="id">Bahasa Indonesia</ToggleGroupItem>
        </ToggleGroup>
      </section>

      <Section title={L('Notifications', 'Notifikasi')}>
        <Row title={L('Email notifications', 'Notifikasi email')} sub={L('Receive updates via email', 'Terima update lewat email')}>
          <Switch checked={emailNotif} onCheckedChange={setEmailNotif} aria-label={L('Email notifications', 'Notifikasi email')} />
        </Row>
        <Row title={L('Document ready alert', 'Alert dokumen selesai')} sub={L('Notify when AI finishes a document', 'Notif saat AI selesai bikin dokumen')}>
          <Switch checked={docDoneNotif} onCheckedChange={setDocDoneNotif} aria-label={L('Document ready alert', 'Alert dokumen selesai')} />
        </Row>
      </Section>

      <Section title={L('Appearance', 'Tampilan')}>
        <Row title={L('Compact mode', 'Mode kompak')} sub={L('Reduce spacing in lists and cards', 'Kurangi jarak di daftar dan kartu')}>
          <Switch checked={compactMode} onCheckedChange={setCompactMode} aria-label={L('Compact mode', 'Mode kompak')} />
        </Row>
      </Section>

      <Section title={L('Data & Privacy', 'Data & Privasi')}>
        <Row title={L('Auto-save drafts', 'Auto-simpan draft')} sub={L('Automatically save input while typing', 'Otomatis simpan input saat mengetik')}>
          <Switch checked={autoSave} onCheckedChange={setAutoSave} aria-label={L('Auto-save drafts', 'Auto-simpan draft')} />
        </Row>
        <Row title={L('Clear local cache', 'Hapus cache lokal')} sub={L('Remove locally saved conversations', 'Hapus percakapan yang tersimpan lokal')}>
          <Button variant="destructive" size="sm" className="h-8 rounded-[12px] px-3 text-xs font-semibold" onClick={() => { localStorage.clear(); window.location.reload() }}><Trash2 /> {L('Clear', 'Hapus')}</Button>
        </Row>
      </Section>
    </div>
  )
}
