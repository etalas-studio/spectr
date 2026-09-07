'use client'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { useLanguage } from '../lib/i18n'
import { apiUrl } from '../api/base'

async function changePassword(current: string, next: string): Promise<void> {
  const res = await fetch(apiUrl('/api/account/password'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ currentPassword: current, newPassword: next }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
}

export default function ProfilePage() {
  const { state } = useAuth()
  const { data: sub } = useSubscription()
  const { lang } = useLanguage()
  const L = (en: string, id: string) => lang === 'id' ? id : en

  const username = state.status === 'authenticated' ? state.username : ''
  const email = state.status === 'authenticated' ? state.email : ''
  const isPro = sub?.planSlug === 'pro'

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwStatus, setPwStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [pwError, setPwError] = useState('')

  async function handleChangePassword() {
    if (newPw !== confirmPw) { setPwError(L('Passwords do not match', 'Password tidak sama')); return }
    if (newPw.length < 6) { setPwError(L('Min 6 characters', 'Minimal 6 karakter')); return }
    setPwStatus('loading'); setPwError('')
    try {
      await changePassword(currentPw, newPw)
      setPwStatus('ok')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Error')
      setPwStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px',
    border: '1px solid rgba(0,0,0,0.12)', backgroundColor: '#fff', color: '#111827', outline: 'none',
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>


        {/* Avatar + info */}
        <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
              style={{ backgroundColor: '#0d9488' }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold" style={{ color: '#111827' }}>{username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: isPro ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.06)', color: isPro ? '#3b82f6' : '#6b7280' }}>
                  {isPro ? 'Pro' : 'Starter'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#9ca3af' }}>
                {L('Username', 'Username')}
              </label>
              <input value={username} readOnly style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'default' }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#9ca3af' }}>
                Email
              </label>
              <input value={email} readOnly style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'default' }} />
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>
            {L('Change Password', 'Ganti Password')}
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#9ca3af' }}>
                {L('Current Password', 'Password Saat Ini')}
              </label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={inputStyle}
                placeholder={L('Enter current password', 'Masukkan password saat ini')}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#9ca3af' }}>
                {L('New Password', 'Password Baru')}
              </label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle}
                placeholder={L('Min 6 characters', 'Minimal 6 karakter')}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#9ca3af' }}>
                {L('Confirm New Password', 'Konfirmasi Password Baru')}
              </label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={inputStyle}
                placeholder={L('Re-enter new password', 'Ulangi password baru')}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>
          </div>

          {pwStatus === 'ok' && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: '#10b981' }}>
              <iconify-icon icon="solar:check-circle-bold" width="16" />
              {L('Password changed successfully', 'Password berhasil diubah')}
            </div>
          )}
          {pwError && (
            <p className="mt-3 text-sm" style={{ color: '#ef4444' }}>{pwError}</p>
          )}

          <button
            onClick={() => void handleChangePassword()}
            disabled={pwStatus === 'loading' || !currentPw || !newPw || !confirmPw}
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#3b82f6' }}>
            {pwStatus === 'loading' ? L('Saving...', 'Menyimpan...') : L('Save Changes', 'Simpan Perubahan')}
          </button>
        </div>

      </div>
    </div>
  )
}
