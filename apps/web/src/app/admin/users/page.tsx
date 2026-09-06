'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Table, TextField, Select, Button, Text, Badge,
  Dialog, AlertDialog, IconButton, Flex, Box,
} from '@radix-ui/themes'
import {
  fetchAdminUsers,
  manageUserSubscription,
  deleteAdminUser,
  setUserRole,
  type AdminUser,
  type AdminUsersResponse,
} from '../../../api/admin'

function planColor(slug: string | undefined): 'green' | 'blue' | 'gray' {
  if (slug === 'pro') return 'green'
  if (slug === 'starter') return 'blue'
  return 'gray'
}

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
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Content maxWidth="400px">
        <Flex justify="between" align="start">
          <Box>
            <Dialog.Title mb="1">Edit user</Dialog.Title>
            <Dialog.Description size="2" color="gray">Update role and plan for this account.</Dialog.Description>
          </Box>
          <Dialog.Close>
            <IconButton size="1" variant="ghost" color="gray" aria-label="Close">
              <iconify-icon icon="solar:close-linear" width="18" />
            </IconButton>
          </Dialog.Close>
        </Flex>
        <Flex direction="column" gap="3" mt="3">
          <Box>
            <Text as="label" size="1" color="gray">Email</Text>
            <TextField.Root value={user.email} readOnly mt="1" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </Box>
          <Box>
            <Text as="label" size="1" color="gray">Username</Text>
            <TextField.Root value={user.username} readOnly mt="1" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </Box>
          <Box>
            <Text as="label" size="1" color="gray">Role</Text>
            <Select.Root value={role} onValueChange={(v) => setRole(v as 'user' | 'admin')}>
              <Select.Trigger mt="1" style={{ width: '100%' }} />
              <Select.Content>
                <Select.Item value="user">user</Select.Item>
                <Select.Item value="admin">admin</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
          <Box>
            <Text as="label" size="1" color="gray">Plan</Text>
            <Select.Root value={plan} onValueChange={(v) => setPlan(v as 'pro' | 'starter' | '')}>
              <Select.Trigger mt="1" placeholder="No plan" style={{ width: '100%' }} />
              <Select.Content>
                <Select.Item value="">No plan</Select.Item>
                <Select.Item value="starter">Starter</Select.Item>
                <Select.Item value="pro">Pro</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
          {err && <Text size="1" color="red">{err}</Text>}
        </Flex>
        <Flex gap="2" justify="end" mt="4">
          <Dialog.Close>
            <Button variant="soft" color="gray">Cancel</Button>
          </Dialog.Close>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
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
    <AlertDialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <AlertDialog.Content maxWidth="400px">
        <Flex justify="between" align="start">
          <Box>
            <AlertDialog.Title mb="1">Delete user</AlertDialog.Title>
            <AlertDialog.Description size="2" color="gray">This action is irreversible and cannot be recovered.</AlertDialog.Description>
          </Box>
          <AlertDialog.Cancel>
            <IconButton size="1" variant="ghost" color="gray" aria-label="Close">
              <iconify-icon icon="solar:close-linear" width="18" />
            </IconButton>
          </AlertDialog.Cancel>
        </Flex>
        <Text size="2" mt="3" as="p">
          This permanently deletes <strong>{user.email}</strong> and all their data.
        </Text>
        <Flex gap="2" justify="end" mt="4">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">Cancel</Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button color="red" disabled={busy} onClick={() => onConfirm(user)}>
              {busy ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
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
  const [actionMsg, setActionMsg] = useState<{ kind: 'error' | 'notice'; text: string } | null>(null)
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
    setBusy(true); setActionMsg(null)
    try { await fn(); setActionMsg({ kind: 'notice', text: okMsg }); await load(page, search, roleFilter) }
    catch (err) { setActionMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Action failed' }) }
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
    setActionMsg({ kind: 'notice', text: `Saved ${user.email}` })
  }

  const deleteUser = (user: AdminUser) => {
    void run(async () => { await deleteAdminUser(user.id); setDeleteTarget(null) }, `Deleted ${user.email}`)
  }

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-10 pt-10 pb-6" style={{ backgroundColor: '#f8fafc' }}>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#111827', fontFamily: "'Instrument Serif', serif" }}>Users</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'rgba(0,0,0,0.45)' }}>All accounts, roles, and subscriptions.</p>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">
        {error && <Text size="2" color="red">{error}</Text>}

        <div className="rounded-2xl border border-black/[0.08] bg-white p-6 space-y-6">
          {/* Toolbar */}
          <Flex wrap="wrap" gap="3" align="center">
            <TextField.Root
              placeholder="Search email or username…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 260 }}
            />
            <Select.Root value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
              <Select.Trigger placeholder="All roles" />
              <Select.Content>
                <Select.Item value="">All roles</Select.Item>
                <Select.Item value="user">User</Select.Item>
                <Select.Item value="admin">Admin</Select.Item>
              </Select.Content>
            </Select.Root>
            {actionMsg && (
              <Flex align="center" gap="2" ml="auto">
                <Text size="1" color={actionMsg.kind === 'error' ? 'red' : 'green'}>{actionMsg.text}</Text>
                <IconButton size="1" variant="ghost" color="gray" onClick={() => setActionMsg(null)}>✕</IconButton>
              </Flex>
            )}
          </Flex>

          {/* Table */}
          {!data ? (
            <Text size="2" color="gray">Loading…</Text>
          ) : (
            <Table.Root variant="surface" size="2">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Plan</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Expires</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.users.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={5}>
                      <Text size="2" color="gray">No users found.</Text>
                    </Table.Cell>
                  </Table.Row>
                ) : data.users.map((user) => (
                  <Table.Row key={user.id}>
                    <Table.Cell><Text size="2">{user.email}</Text></Table.Cell>
                    <Table.Cell><Text size="2" color="gray">{user.username}</Text></Table.Cell>
                    <Table.Cell>
                      <Badge color={user.role === 'admin' ? 'yellow' : 'gray'} variant="soft" radius="full">
                        {user.role}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {user.subscription ? (
                        <Badge color={planColor(user.subscription.planSlug)} variant="soft" radius="full">
                          {user.subscription.planSlug}
                        </Badge>
                      ) : <Text color="gray">—</Text>}
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">{formatExpiry(user.subscription?.expiresAt ?? null)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="3">
                        <IconButton size="2" variant="ghost" color="gray" onClick={() => setEditTarget(user)} aria-label="Edit user">
                          <iconify-icon icon="solar:pen-linear" width="16" />
                        </IconButton>
                        <IconButton size="2" variant="ghost" color="red" onClick={() => setDeleteTarget(user)} aria-label="Delete user">
                          <iconify-icon icon="solar:trash-bin-trash-linear" width="16" />
                        </IconButton>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}

          {/* Pagination */}
          <Flex justify="between" align="center" pt="2">
            <Text size="1" color="gray">Page {page} of {totalPages}</Text>
            <Flex gap="1">
              <Button variant="soft" size="1" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <Button key={n} size="1" variant={n === page ? 'solid' : 'soft'} onClick={() => setPage(n)}>{n}</Button>
              ))}
              <Button variant="soft" size="1" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
            </Flex>
          </Flex>
        </div>
      </div>

      <EditModal user={editTarget} open={editTarget !== null} onClose={() => setEditTarget(null)} onSave={saveUser} />
      <DeleteModal user={deleteTarget} open={deleteTarget !== null} busy={busy} onClose={() => setDeleteTarget(null)} onConfirm={deleteUser} />
    </div>
  )
}
