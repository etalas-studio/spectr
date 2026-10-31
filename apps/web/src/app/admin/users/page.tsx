'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pencil, Save, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectIcon, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ChevronDownIcon } from 'lucide-react'
import {
  fetchAdminUsers,
  manageUserSubscription,
  deleteAdminUser,
  setUserRole,
  type AdminUser,
  type AdminUsersResponse,
} from '../../../api/admin'

const fieldTrigger = 'h-10 w-full justify-between rounded-xl border border-input bg-muted/60 px-3.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'
const labelCls = 'mb-1.5 block text-xs font-medium text-[var(--ap-ink-3,#5b6472)]'

function planTone(slug: string | undefined): 'green' | 'blue' | 'gray' {
  if (slug === 'pro') return 'green'
  if (slug === 'starter') return 'blue'
  return 'gray'
}

const ROLE_LABEL: Record<string, string> = { '': 'All roles', user: 'User', admin: 'Admin' }
const PLAN_LABEL: Record<string, string> = { '': 'No plan', starter: 'Starter', pro: 'Pro' }

function formatExpiry(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID')
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({
  user, open, onClose, onSave,
}: {
  user: AdminUser | null
  open: boolean
  onClose: () => void
  onSave: (user: AdminUser, changes: { role: 'user' | 'admin'; plan: 'pro' | 'starter' | '' }) => Promise<void>
}) {
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [plan, setPlan] = useState<'pro' | 'starter' | ''>('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setRole(user.role as 'user' | 'admin')
    setPlan((user.subscription?.planSlug as 'pro' | 'starter') ?? '')
    setErr(null)
  }, [open, user])

  if (!user) return null

  const handleSave = async () => {
    setSaving(true); setErr(null)
    try { await onSave(user, { role, plan }); onClose() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="gap-0 rounded-2xl p-6 sm:max-w-[400px]">
        <DialogTitle className="text-lg leading-7 font-semibold tracking-tight">Edit user</DialogTitle>
        <DialogDescription className="mt-0.5 text-sm text-[var(--ap-ink-3,#5b6472)]">Update role and plan for this account.</DialogDescription>
        <div className="mt-5 flex flex-col gap-4">
          <div>
            <Label className={labelCls}>Email</Label>
            <Input value={user.email} readOnly className="cursor-not-allowed opacity-50" />
          </div>
          <div>
            <Label className={labelCls}>Username</Label>
            <Input value={user.username} readOnly className="cursor-not-allowed opacity-50" />
          </div>
          <div>
            <Label className={labelCls}>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'user' | 'admin')}>
              <SelectTrigger className={fieldTrigger} aria-label="Role">
                <SelectValue />
                <SelectIcon><ChevronDownIcon className="size-3.5 text-[var(--ap-ink-4,#6b7280)]" /></SelectIcon>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">user</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={labelCls}>Plan</Label>
            <Select value={plan} onValueChange={(v) => setPlan((v ?? '') as 'pro' | 'starter' | '')}>
              <SelectTrigger className={fieldTrigger} aria-label="Plan">
                <SelectValue>{(v) => PLAN_LABEL[(v as string) ?? ''] ?? 'No plan'}</SelectValue>
                <SelectIcon><ChevronDownIcon className="size-3.5 text-[var(--ap-ink-4,#6b7280)]" /></SelectIcon>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No plan</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {err && <p className="text-xs text-red-600 dark:text-red-300">{err}</p>}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" className="h-10 gap-2 rounded-[12px] px-4 bg-[rgb(var(--ap-ov,0_0_0)/0.06)] font-semibold text-[var(--ap-ink-2,#374151)] hover:bg-[rgb(var(--ap-ov,0_0_0)/0.1)]" onClick={onClose}><X /> Cancel</Button>
          <Button variant="primary" className="h-10 gap-2 px-4 font-semibold" onClick={handleSave} disabled={saving}>
            <Save /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete confirm modal ───────────────────────────────────────────────────────
function DeleteModal({
  user, open, busy, onClose, onConfirm,
}: {
  user: AdminUser | null
  open: boolean
  busy: boolean
  onClose: () => void
  onConfirm: (user: AdminUser) => void
}) {
  if (!user) return null
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="gap-0 rounded-2xl p-6 sm:max-w-[420px]">
        <span className="flex size-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300"><Trash2 className="size-[18px]" /></span>
        <DialogTitle className="mt-4 text-lg leading-7 font-semibold tracking-tight">Delete user</DialogTitle>
        <DialogDescription className="mt-1 text-sm leading-5 text-[var(--ap-ink-3,#5b6472)]">
          This permanently deletes <strong className="font-semibold text-[var(--ap-ink-2,#374151)]">{user.email}</strong> and all their data. This action is irreversible and cannot be recovered.
        </DialogDescription>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" className="h-10 gap-2 rounded-[12px] px-4 bg-[rgb(var(--ap-ov,0_0_0)/0.06)] font-semibold text-[var(--ap-ink-2,#374151)] hover:bg-[rgb(var(--ap-ov,0_0_0)/0.1)]" onClick={onClose}><X /> Cancel</Button>
          <Button className="h-10 gap-2 rounded-[12px] px-4 bg-[#dc2626] font-semibold text-white hover:bg-[#b91c1c]" disabled={busy} onClick={() => onConfirm(user)}>
            <Trash2 /> {busy ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [data, setData] = useState<AdminUsersResponse | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const LIMIT = 50
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (p: number, q: string, r: string) => {
    try {
      setError(null)
      setData(await fetchAdminUsers(p, LIMIT, q || undefined, r || undefined))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    }
  }, [])

  useEffect(() => { void load(page, search, roleFilter) }, [load, page, search, roleFilter])

  const handleSearch = (val: string) => {
    setSearch(val); setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void load(1, val, roleFilter), 350)
  }

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true)
    try { await fn(); toast.success(okMsg); await load(page, search, roleFilter) }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Action failed') }
    finally { setBusy(false) }
  }

  const saveUser = async (user: AdminUser, changes: { role: 'user' | 'admin'; plan: 'pro' | 'starter' | '' }) => {
    const ops: Promise<unknown>[] = []
    if (changes.role !== user.role) ops.push(setUserRole(user.id, changes.role))
    const currentPlan = (user.subscription?.planSlug ?? '') as 'pro' | 'starter' | ''
    if (changes.plan !== currentPlan) {
      if (changes.plan) ops.push(manageUserSubscription(user.id, 'grant', changes.plan))
      else ops.push(manageUserSubscription(user.id, 'cancel'))
    }
    await Promise.all(ops)
    await load(page, search, roleFilter)
    toast.success(`Saved ${user.email}`)
  }

  const deleteUser = (user: AdminUser) => {
    void run(async () => { await deleteAdminUser(user.id); setDeleteTarget(null) }, `Deleted ${user.email}`)
  }

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-6 pt-2 pb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ap-ink,#111827)]">Users</h1>
        <p className="mt-1.5 text-sm text-[var(--ap-ink-4,#6b7280)]">All accounts, roles, and subscriptions.</p>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">
        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-300">{error}</p>}

        <div className="space-y-5 rounded-2xl border border-[rgb(var(--ap-ov,0_0_0)/0.08)] bg-[var(--ap-surface,#fff)] p-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-[260px]">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--ap-ink-4,#6b7280)]" />
              <Input
                placeholder="Search email or username…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v ?? ''); setPage(1) }}>
              <SelectTrigger className={`${fieldTrigger} w-40`} aria-label="Filter by role">
                <SelectValue>{(v) => ROLE_LABEL[(v as string) ?? ''] ?? 'All roles'}</SelectValue>
                <SelectIcon><ChevronDownIcon className="size-3.5 text-[var(--ap-ink-4,#6b7280)]" /></SelectIcon>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {!data ? (
            <p className="text-sm text-[var(--ap-ink-3,#5b6472)]">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-[var(--ap-ink-3,#5b6472)]">No users found.</TableCell>
                  </TableRow>
                ) : data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-[var(--ap-ink-3,#5b6472)]">{user.username}</TableCell>
                    <TableCell>
                      <Badge tone={user.role === 'admin' ? 'amber' : 'gray'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <Badge tone={planTone(user.subscription.planSlug)}>{user.subscription.planSlug}</Badge>
                      ) : <span className="text-[var(--ap-ink-4,#6b7280)]">—</span>}
                    </TableCell>
                    <TableCell className="text-[var(--ap-ink-3,#5b6472)]">{formatExpiry(user.subscription?.expiresAt ?? null)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" className="text-[var(--ap-ink-3,#5b6472)]" onClick={() => setEditTarget(user)} aria-label="Edit user"><Pencil /></Button>
                        <Button variant="ghost" size="icon-sm" className="text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-300" onClick={() => setDeleteTarget(user)} aria-label="Delete user"><Trash2 /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[var(--ap-ink-3,#5b6472)]">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" className="bg-[rgb(var(--ap-ov,0_0_0)/0.06)]" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <Button key={n} size="sm" variant={n === page ? 'primary' : 'secondary'} className={n === page ? '' : 'bg-[rgb(var(--ap-ov,0_0_0)/0.06)]'} onClick={() => setPage(n)}>{n}</Button>
              ))}
              <Button variant="secondary" size="sm" className="bg-[rgb(var(--ap-ov,0_0_0)/0.06)]" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          </div>
        </div>
      </div>

      <EditModal user={editTarget} open={editTarget !== null} onClose={() => setEditTarget(null)} onSave={saveUser} />
      <DeleteModal user={deleteTarget} open={deleteTarget !== null} busy={busy} onClose={() => setDeleteTarget(null)} onConfirm={deleteUser} />
    </div>
  )
}
