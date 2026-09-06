'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table, TextField, Select, Button, Text, Flex, Badge } from '@radix-ui/themes'
import { fetchAdminStats, type AdminStatsPayment } from '../../../api/admin'

const PAGE_SIZE = 10

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function statusBadge(status: string) {
  const color = status === 'settlement' ? 'green' : status === 'pending' ? 'yellow' : 'red'
  return <Badge color={color} variant="soft" radius="full">{status}</Badge>
}

const STATUS_OPTIONS = ['all', 'pending', 'settlement', 'failure']
const PLAN_OPTIONS = ['all', 'starter', 'pro']

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminStatsPayment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    try {
      const stats = await fetchAdminStats()
      setPayments(stats.recentPayments)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!payments) return []
    return payments.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.orderId.toLowerCase().includes(q) || (p.userEmail ?? '').toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || p.transactionStatus === statusFilter
      const matchPlan = planFilter === 'all' || p.planSlug === planFilter
      return matchSearch && matchStatus && matchPlan
    })
  }, [payments, search, statusFilter, planFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // reset to page 1 on filter change
  const setSearchReset = (v: string) => { setSearch(v); setPage(1) }
  const setStatusReset = (v: string) => { setStatusFilter(v); setPage(1) }
  const setPlanReset = (v: string) => { setPlanFilter(v); setPage(1) }

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-10 pt-10 pb-6" style={{ backgroundColor: '#f8fafc' }}>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#111827', fontFamily: "'Instrument Serif', serif" }}>Payments</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'rgba(0,0,0,0.45)' }}>Recent transactions.</p>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!payments && !error && <p className="text-sm text-neutral-400">Loading…</p>}
        {payments && (
          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 space-y-6">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <TextField.Root
                placeholder="Search order or email…"
                value={search}
                onChange={e => setSearchReset(e.target.value)}
                style={{ width: 260 }}
              />
              <Select.Root value={statusFilter} onValueChange={setStatusReset}>
                <Select.Trigger placeholder="All statuses" />
                <Select.Content>
                  {STATUS_OPTIONS.map(s => (
                    <Select.Item key={s} value={s}>{s === 'all' ? 'All statuses' : s}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Select.Root value={planFilter} onValueChange={setPlanReset}>
                <Select.Trigger placeholder="All plans" />
                <Select.Content>
                  {PLAN_OPTIONS.map(p => (
                    <Select.Item key={p} value={p}>{p === 'all' ? 'All plans' : p}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>

            {/* Table */}
            {paginated.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4">No payments match your filters.</p>
            ) : (
              <Table.Root variant="surface" size="2">
                <Table.Header>
                  <Table.Row>
                    {['Order', 'Email', 'Plan', 'Amount', 'Status', 'Fraud', 'Date'].map((h) => (
                      <Table.ColumnHeaderCell key={h}>{h}</Table.ColumnHeaderCell>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paginated.map((p) => (
                    <Table.Row key={p.orderId}>
                      <Table.Cell><span className="font-mono text-xs text-neutral-500">{p.orderId.slice(0, 16)}…</span></Table.Cell>
                      <Table.Cell>{p.userEmail ?? '—'}</Table.Cell>
                      <Table.Cell>
                        {p.planSlug ? (
                          <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-0.5 text-xs text-neutral-700">{p.planSlug}</span>
                        ) : '—'}
                      </Table.Cell>
                      <Table.Cell><span className="font-medium" style={{ color: '#111827' }}>{formatRupiah(Number(p.grossAmount))}</span></Table.Cell>
                      <Table.Cell>{statusBadge(p.transactionStatus)}</Table.Cell>
                      <Table.Cell className="text-neutral-500">{p.fraudStatus ?? '—'}</Table.Cell>
                      <Table.Cell className="text-neutral-500">{new Date(p.createdAt).toLocaleDateString('id-ID')}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <Flex align="center" gap="3">
                <Text size="1" color="gray">Page {page} of {totalPages}</Text>
                <Text size="1" color="gray">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</Text>
              </Flex>
              <div className="flex items-center gap-1">
                <Button variant="soft" size="1" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <Button key={n} size="1" variant={n === page ? 'solid' : 'soft'} onClick={() => setPage(n)}>{n}</Button>
                ))}
                <Button variant="soft" size="1" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
