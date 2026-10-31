'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDownIcon, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectIcon, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchAdminStats, type AdminStatsPayment } from '../../../api/admin'

const PAGE_SIZE = 10

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function statusBadge(status: AdminStatsPayment['status']) {
  const tone = status === 'settled' ? 'green' : status === 'pending' ? 'amber' : 'red'
  return <Badge tone={tone}>{status}</Badge>
}

const fieldTrigger = 'h-10 w-40 justify-between rounded-xl border border-input bg-muted/60 px-3.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'

const STATUS_OPTIONS = ['all', 'pending', 'settled', 'failed']
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
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
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
      <header className="shrink-0 px-6 pt-2 pb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ap-ink,#111827)]">Payments</h1>
        <p className="mt-1.5 text-sm text-[var(--ap-ink-4,#6b7280)]">Recent transactions.</p>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">
        {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
        {!payments && !error && <p className="text-sm text-[var(--ap-ink-4,#6b7280)]">Loading…</p>}
        {payments && (
          <div className="rounded-2xl border border-[rgb(var(--ap-ov,0_0_0)/0.08)] bg-[var(--ap-surface,#fff)] p-6 space-y-5">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-[260px]">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--ap-ink-4,#6b7280)]" />
                <Input
                  placeholder="Search order or email…"
                  value={search}
                  onChange={e => setSearchReset(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusReset(v ?? 'all')}>
                <SelectTrigger className={fieldTrigger} aria-label="Filter by status">
                  <SelectValue>{(v) => (v === 'all' ? 'All statuses' : (v as string))}</SelectValue>
                  <SelectIcon><ChevronDownIcon className="size-3.5 text-[var(--ap-ink-4,#6b7280)]" /></SelectIcon>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={(v) => setPlanReset(v ?? 'all')}>
                <SelectTrigger className={fieldTrigger} aria-label="Filter by plan">
                  <SelectValue>{(v) => (v === 'all' ? 'All plans' : (v as string))}</SelectValue>
                  <SelectIcon><ChevronDownIcon className="size-3.5 text-[var(--ap-ink-4,#6b7280)]" /></SelectIcon>
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p === 'all' ? 'All plans' : p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {paginated.length === 0 ? (
              <p className="text-sm text-[var(--ap-ink-3,#5b6472)] py-4">No payments match your filters.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {['Order', 'Email', 'Plan', 'Amount', 'Status', 'Fraud', 'Date'].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((p) => (
                    <TableRow key={p.orderId}>
                      <TableCell><span className="font-mono text-xs text-[var(--ap-ink-3,#5b6472)]">{p.orderId.slice(0, 16)}…</span></TableCell>
                      <TableCell>{p.userEmail ?? '—'}</TableCell>
                      <TableCell>
                        {p.planSlug ? <Badge tone="blue">{p.planSlug}</Badge> : '—'}
                      </TableCell>
                      <TableCell><span className="font-medium text-[var(--ap-ink,#111827)]">{formatRupiah(Number(p.grossAmount))}</span></TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-[var(--ap-ink-3,#5b6472)]">{p.fraudStatus ?? '—'}</TableCell>
                      <TableCell className="text-[var(--ap-ink-3,#5b6472)]">{new Date(p.createdAt).toLocaleDateString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-xs text-[var(--ap-ink-3,#5b6472)]">
                <span>Page {page} of {totalPages}</span>
                <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="sm" className="bg-[rgb(var(--ap-ov,0_0_0)/0.06)]" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <Button key={n} size="sm" variant={n === page ? 'primary' : 'secondary'} className={n === page ? '' : 'bg-[rgb(var(--ap-ov,0_0_0)/0.06)]'} onClick={() => setPage(n)}>{n}</Button>
                ))}
                <Button variant="secondary" size="sm" className="bg-[rgb(var(--ap-ov,0_0_0)/0.06)]" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
