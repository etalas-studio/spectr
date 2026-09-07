import { useState } from 'react'
import { useLanguage, type Lang } from '../lib/i18n'
import { useSubscription } from '../hooks/useSubscription'

export default function Settings({ onUpgrade }: { onUpgrade?: () => void }) {
  const { lang, setLang } = useLanguage()
  const L = (en: string, id: string) => lang === 'id' ? id : en
  const { data: sub } = useSubscription()

  const isPro = sub?.planSlug === 'pro'
  const expiresAt = sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const startedAt = (sub as { startedAt?: string } | null | undefined)?.startedAt
    ? new Date((sub as { startedAt: string }).startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const [emailNotif, setEmailNotif] = useState(true)
  const [docDoneNotif, setDocDoneNotif] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  const sectionClass = 'rounded-2xl p-6 mb-4'
  const sectionStyle = { backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)' }
  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: '16px', display: 'block' }
  const rowClass = 'flex items-center justify-between py-3'
  const dividerStyle: React.CSSProperties = { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', margin: '0 0' }

  function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        onClick={() => onChange(!on)}
        className="relative shrink-0 transition-colors"
        style={{ width: 40, height: 22, borderRadius: 999, backgroundColor: on ? '#3b82f6' : 'rgba(0,0,0,0.12)' }}>
        <span className="absolute top-[3px] transition-all"
          style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', left: on ? 21 : 3 }} />
      </button>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>


        {/* Subscription */}
        <div className={sectionClass} style={sectionStyle}>
          <span style={labelStyle}>Subscription</span>

          <div className={rowClass}>
            <p className="text-sm font-medium" style={{ color: '#111827' }}>Current plan</p>
            <span className="text-sm font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: isPro ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.06)', color: isPro ? '#3b82f6' : '#6b7280' }}>
              {isPro ? 'Pro' : 'Starter'}
            </span>
          </div>

          {startedAt && (
            <>
              <div style={dividerStyle} />
              <div className={rowClass}>
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Started</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>{startedAt}</p>
              </div>
            </>
          )}

          {(isPro || expiresAt) && (
            <>
              <div style={dividerStyle} />
              <div className={rowClass}>
                <p className="text-sm font-medium" style={{ color: '#111827' }}>{sub?.expired ? 'Expired' : 'Renews'}</p>
                <p className="text-sm" style={{ color: sub?.expired ? '#ef4444' : '#6b7280' }}>{expiresAt ?? '—'}</p>
              </div>
            </>
          )}

          <div style={dividerStyle} />
          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#111827' }}>{isPro ? 'Manage plan' : 'Upgrade to Pro'}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{isPro ? 'Change or cancel your subscription' : 'Unlock unlimited documents & AI chat'}</p>
            </div>
            <button onClick={onUpgrade}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#3b82f6' }}>
              {isPro ? 'Manage' : 'Upgrade'}
            </button>
          </div>
        </div>

        {/* Language */}
        <div className={sectionClass} style={sectionStyle}>
          <span style={labelStyle}>{L('Language', 'Bahasa')}</span>
          <div className="flex gap-2">
            {([['en', 'English'], ['id', 'Bahasa Indonesia']] as [Lang, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setLang(val)}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: lang === val ? '#3b82f6' : 'rgba(0,0,0,0.05)',
                  color: lang === val ? '#fff' : '#374151',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className={sectionClass} style={sectionStyle}>
          <span style={labelStyle}>{L('Notifications', 'Notifikasi')}</span>

          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#111827' }}>{L('Email notifications', 'Notifikasi email')}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{L('Receive updates via email', 'Terima update lewat email')}</p>
            </div>
            <Toggle on={emailNotif} onChange={setEmailNotif} />
          </div>
          <div style={dividerStyle} />
          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#111827' }}>{L('Document ready alert', 'Alert dokumen selesai')}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{L('Notify when AI finishes a document', 'Notif saat AI selesai bikin dokumen')}</p>
            </div>
            <Toggle on={docDoneNotif} onChange={setDocDoneNotif} />
          </div>
        </div>

        {/* Appearance */}
        <div className={sectionClass} style={sectionStyle}>
          <span style={labelStyle}>{L('Appearance', 'Tampilan')}</span>

          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#111827' }}>{L('Compact mode', 'Mode kompak')}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{L('Reduce spacing in lists and cards', 'Kurangi jarak di daftar dan kartu')}</p>
            </div>
            <Toggle on={compactMode} onChange={setCompactMode} />
          </div>
        </div>

        {/* Data & Privacy */}
        <div className={sectionClass} style={sectionStyle}>
          <span style={labelStyle}>{L('Data & Privacy', 'Data & Privasi')}</span>

          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#111827' }}>{L('Auto-save drafts', 'Auto-simpan draft')}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{L('Automatically save input while typing', 'Otomatis simpan input saat mengetik')}</p>
            </div>
            <Toggle on={autoSave} onChange={setAutoSave} />
          </div>
          <div style={dividerStyle} />
          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#111827' }}>{L('Clear local cache', 'Hapus cache lokal')}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{L('Remove locally saved conversations', 'Hapus percakapan yang tersimpan lokal')}</p>
            </div>
            <button
              onClick={() => { localStorage.clear(); window.location.reload() }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}>
              {L('Clear', 'Hapus')}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
