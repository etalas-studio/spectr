'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { useLanguage } from '../lib/i18n'
import { apiUrl } from '../api/base'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-[var(--ap-ink-4,#6b7280)] uppercase">{label}</span>
      {children}
    </Label>
  )
}

export default function ProfilePage() {
  const { state } = useAuth()
  const { data: sub } = useSubscription()
  const { lang } = useLanguage()
  const L = (en: string, id: string) => (lang === 'id' ? id : en)

  const username = state.status === 'authenticated' ? state.username : ''
  const email = state.status === 'authenticated' ? state.email : ''
  const isPro = sub?.planSlug === 'pro'

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [pwError, setPwError] = useState('')

  async function handleChangePassword() {
    if (newPw !== confirmPw) { setPwError(L('Passwords do not match', 'Password tidak sama')); return }
    if (newPw.length < 6) { setPwError(L('Min 6 characters', 'Minimal 6 karakter')); return }
    setLoading(true); setPwError('')
    try {
      await changePassword(currentPw, newPw)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      toast.success(L('Password changed', 'Password diubah'), { description: L('Use your new password next time you sign in.', 'Pakai password baru saat login berikutnya.') })
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Error')
      toast.error(L("Couldn't change password", 'Gagal mengganti password'), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 pt-2 pb-6">
      <section className="mb-4 rounded-2xl border bg-[var(--ap-surface,#fff)] p-6">
        <div className="mb-6 flex items-center gap-4">
          <span className="ap-avatar size-16 text-2xl">{username.charAt(0).toUpperCase()}</span>
          <div>
            <p className="text-lg font-semibold">{username}</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPro ? 'bg-primary/10 text-primary' : 'bg-[rgb(var(--ap-ov,0_0_0)/0.06)] text-[var(--ap-ink-3,#5b6472)]'}`}>{isPro ? 'Pro' : 'Starter'}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Field label="Username"><Input value={username} readOnly className="cursor-default text-[var(--ap-ink-3,#5b6472)]" /></Field>
          <Field label="Email"><Input value={email} readOnly className="cursor-default text-[var(--ap-ink-3,#5b6472)]" /></Field>
        </div>
      </section>

      <section className="rounded-2xl border bg-[var(--ap-surface,#fff)] p-6">
        <h2 className="mb-4 text-sm font-semibold">{L('Change Password', 'Ganti Password')}</h2>
        <div className="flex flex-col gap-3">
          <Field label={L('Current Password', 'Password Saat Ini')}>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder={L('Enter current password', 'Masukkan password saat ini')} autoComplete="current-password" />
          </Field>
          <Field label={L('New Password', 'Password Baru')}>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder={L('Min 6 characters', 'Minimal 6 karakter')} autoComplete="new-password" />
          </Field>
          <Field label={L('Confirm New Password', 'Konfirmasi Password Baru')}>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder={L('Re-enter new password', 'Ulangi password baru')} autoComplete="new-password" />
          </Field>
        </div>
        {pwError && <p className="mt-3 text-sm text-destructive" role="alert">{pwError}</p>}
        <Button
          onClick={() => void handleChangePassword()}
          disabled={loading || !currentPw || !newPw || !confirmPw}
          variant="primary" className="mt-4 h-10 w-full text-sm font-semibold"
        >
          <Save /> {loading ? L('Saving...', 'Menyimpan...') : L('Save Changes', 'Simpan Perubahan')}
        </Button>
      </section>
    </div>
  )
}
