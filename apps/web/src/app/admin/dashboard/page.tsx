'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  fetchAdminStats, fetchAdminHealth,
  type AdminStats, type AdminStatsPayment, type TopUser, type RevenueTrendPoint, type AdminHealth,
} from '../../../api/admin'

const css = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes badge-glow {
    0%, 100% { box-shadow: 0 0 0 3px rgba(52,211,153,0.15); }
    50%       { box-shadow: 0 0 0 6px rgba(52,211,153,0.08); }
  }
  .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
  .glow    { animation: badge-glow 2.4s ease-in-out infinite; }
`

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatRp(n: number) { return `Rp ${n.toLocaleString('id-ID')}` }
function formatK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

// ─── primitives ───────────────────────────────────────────────────────────────
function Card({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  return (
    <div className={`fade-up rounded-2xl bg-white p-5 ${className}`}
      style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function CardHeader({ icon, title, right }: { icon: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <iconify-icon icon={icon} width="15" style={{ color: '#9ca3af' }} />
        <span className="text-sm font-semibold" style={{ color: '#111827' }}>{title}</span>
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-xs font-medium transition-colors"
      style={{ color: '#9ca3af' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
      onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
      See All
    </Link>
  )
}

function PeriodPills({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
          style={o === value
            ? { background: '#fff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
            : { background: 'transparent', color: '#9ca3af' }}>
          {o}
        </button>
      ))}
    </div>
  )
}

function DeltaBadge({ n, suffix = '%' }: { n: number; suffix?: string }) {
  const up = n >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
      {up ? '↑' : '↓'} {Math.abs(n)}{suffix}
    </span>
  )
}

function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = {
    settlement: 'bg-emerald-50 text-emerald-600',
    pending:    'bg-amber-50 text-amber-600',
    failure:    'bg-red-50 text-red-500',
  }
  const label: Record<string, string> = { settlement: 'Settled', pending: 'Pending', failure: 'Failed' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[s] ?? 'bg-gray-100 text-gray-500'}`}>
      {label[s] ?? s}
    </span>
  )
}

function ChipLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(0,0,0,0.06)', color: '#6b7280' }}>
      {children}
    </span>
  )
}

function DarkTip({ active, payload, label, fmt }: {
  active?: boolean; payload?: { value: number }[]; label?: string; fmt?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1f2937', borderRadius: 10, padding: '7px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      {label && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 2 }}>{label}</p>}
      <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{fmt ? fmt(payload[0].value) : payload[0].value.toLocaleString()}</p>
    </div>
  )
}

// ─── 1. Stat tile ─────────────────────────────────────────────────────────────
function StatTile({ label, value, icon, delta, sub, delay = 0 }: {
  label: string; value: string | number; icon: string
  delta?: number; sub?: string; delay?: number
}) {
  return (
    <Card delay={delay}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <iconify-icon icon={icon} width="13" style={{ color: '#9ca3af' }} />
          <span className="text-[11px] font-medium" style={{ color: '#9ca3af' }}>{label}</span>
        </div>
        {delta !== undefined && <DeltaBadge n={delta} suffix="" />}
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color: '#111827' }}>{value}</div>
      {sub && <div className="mt-1 text-[11px]" style={{ color: '#9ca3af' }}>{sub}</div>}
    </Card>
  )
}

// ─── 2. Revenue tracker ───────────────────────────────────────────────────────
function RevenueTracker({ trend, thisMonth, delay = 0 }: {
  trend: RevenueTrendPoint[]; thisMonth: number; delay?: number
}) {
  const [period, setPeriod] = useState('6M')
  const n = period === '1M' ? 1 : period === '3M' ? 3 : 6
  const data = trend.slice(-n).map(t => ({ name: t.month.slice(5), value: t.revenue }))
  const last = data[data.length - 1]?.value ?? 0
  const prev = data[data.length - 2]?.value ?? 0
  const delta = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null

  return (
    <Card delay={delay} className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <iconify-icon icon="solar:graph-up-linear" width="15" style={{ color: '#9ca3af' }} />
          <span className="text-sm font-semibold" style={{ color: '#111827' }}>Revenue Tracker</span>
        </div>
        <PeriodPills options={['1M', '3M', '6M']} value={period} onChange={setPeriod} />
      </div>
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>{formatRp(thisMonth)}</span>
        {delta !== null && <DeltaBadge n={delta} />}
      </div>
      <p className="text-[11px] mb-5" style={{ color: '#9ca3af' }}>This month · settled payments only</p>
      {data.length >= 2 ? (
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatK} />
            <Tooltip content={<DarkTip fmt={formatRp} />} />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2}
              fill="url(#rg)" dot={false} activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[130px] items-center justify-center text-xs" style={{ color: '#9ca3af' }}>
          Not enough data yet
        </div>
      )}
    </Card>
  )
}

// ─── 3. Recent payments ───────────────────────────────────────────────────────
const PTABS = ['All', 'Settled', 'Pending', 'Failed']
const PMAP: Record<string, string> = { Settled: 'settlement', Pending: 'pending', Failed: 'failure' }

function RecentPayments({ payments, delay = 0 }: { payments: AdminStatsPayment[]; delay?: number }) {
  const [tab, setTab] = useState('All')
  const list = (tab === 'All' ? payments : payments.filter(p => p.transactionStatus === PMAP[tab])).slice(0, 5)

  return (
    <Card delay={delay} className="h-full">
      <CardHeader icon="solar:card-linear" title="Recent Payments" right={<SeeAll href="/admin/payments" />} />
      {/* tabs */}
      <div className="flex gap-0.5 rounded-lg p-0.5 mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
        {PTABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-1 rounded-md text-[11px] font-medium transition-all"
            style={t === tab
              ? { background: '#fff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { background: 'transparent', color: '#9ca3af' }}>
            {t}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="py-6 text-center text-xs" style={{ color: '#9ca3af' }}>No payments found.</p>
      ) : (
        <div>
          {list.map((p, i) => (
            <div key={p.orderId} className="flex items-center gap-3 py-2.5"
              style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}>
                <iconify-icon icon="solar:card-transfer-linear" width="14" style={{ color: '#3b82f6' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: '#111827' }}>
                  {p.userEmail ?? p.orderId.slice(0, 14) + '…'}
                </div>
                <div className="text-[11px]" style={{ color: '#9ca3af' }}>
                  {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="text-right shrink-0 space-y-0.5">
                <div className="text-xs font-semibold" style={{ color: '#111827' }}>{formatRp(Number(p.grossAmount))}</div>
                <StatusPill s={p.transactionStatus} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── 4. Plan distribution (half-donut) ───────────────────────────────────────
function PlanBreakdown({ total, pro, delay = 0 }: { total: number; pro: number; delay?: number }) {
  const free = Math.max(0, total - pro)
  const pct = total > 0 ? Math.round((pro / total) * 100) : 0
  const donut = [{ value: pro || 0.001 }, { value: free || 0.001 }]

  return (
    <Card delay={delay}>
      <CardHeader icon="solar:crown-linear" title="Plan Distribution" />
      <div className="flex flex-col items-center">
        {/* half donut */}
        <div style={{ width: 160, height: 88, position: 'relative' }}>
          <PieChart width={160} height={88}>
            <Pie data={donut} cx={75} cy={84} startAngle={180} endAngle={0}
              innerRadius={48} outerRadius={68} dataKey="value" stroke="none">
              <Cell fill="#f59e0b" />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{pct}%</span>
          </div>
        </div>
        <p className="text-[11px] mt-1.5 mb-4" style={{ color: '#9ca3af' }}>Pro conversion rate</p>
        <div className="w-full space-y-2.5">
          {[{ label: 'Pro', count: pro, color: '#f59e0b' }, { label: 'Free', count: free, color: '#e5e7eb' }].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: row.color }} />
                <span className="text-xs" style={{ color: '#6b7280' }}>{row.label}</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: '#111827' }}>{row.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ─── 5. Top users ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f97316']

function TopUsers({ users, delay = 0 }: { users: TopUser[]; delay?: number }) {
  const max = Math.max(...users.map(u => u.totalUsage), 1)
  return (
    <Card delay={delay}>
      <CardHeader icon="solar:users-group-rounded-linear" title="Top Users" right={<SeeAll href="/admin/users" />} />
      {users.length === 0 ? (
        <p className="py-6 text-center text-xs" style={{ color: '#9ca3af' }}>No usage data yet.</p>
      ) : (
        <div>
          {users.map((u, i) => (
            <div key={u.email} className="flex items-center gap-3 py-2.5"
              style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                {(u.username || u.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: '#111827' }}>
                  {u.username || u.email.split('@')[0]}
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.07)' }}>
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${(u.totalUsage / max) * 100}%` }} />
                </div>
              </div>
              <span className="text-xs font-semibold shrink-0 ml-2" style={{ color: '#111827' }}>{u.totalUsage}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── 6. System health ─────────────────────────────────────────────────────────
type HealthState = { status: 'loading' } | { status: 'error' } | { status: 'ok'; data: AdminHealth }

function SystemHealth({ health, delay = 0 }: { health: HealthState; delay?: number }) {
  const fmtUp = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }
  return (
    <Card delay={delay}>
      <CardHeader icon="solar:server-minimalistic-linear" title="System Health" />
      {health.status === 'loading' && <p className="text-xs py-4" style={{ color: '#9ca3af' }}>Checking…</p>}
      {health.status === 'error' && (
        <div className="flex items-center gap-2 py-2">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
          <span className="text-sm font-medium text-red-500">Service unreachable</span>
        </div>
      )}
      {health.status === 'ok' && (
        <>
          <div className="flex items-center gap-2 mb-4 rounded-xl py-2.5 px-3" style={{ backgroundColor: 'rgba(16,185,129,0.07)' }}>
            <span className="glow inline-block h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-emerald-600">All systems operational</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'DB Latency', value: `${health.data.dbMs}ms` },
              { label: 'Uptime', value: fmtUp(health.data.uptimeSeconds) },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                <div className="text-[11px] mb-1" style={{ color: '#9ca3af' }}>{m.label}</div>
                <div className="text-lg font-bold" style={{ color: '#111827' }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1.5" style={{ color: '#9ca3af' }}>
              <span>Availability</span><span>100%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.07)' }}>
              <div className="h-full w-full rounded-full bg-emerald-400" />
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

// ─── 7. Usage breakdown ───────────────────────────────────────────────────────
function UsageBreakdown({ doc, prototype, chat, delay = 0 }: {
  doc: number; prototype: number; chat: number; delay?: number
}) {
  const rows = [
    { label: 'Documents', value: doc, color: '#3b82f6' },
    { label: 'Prototypes', value: prototype, color: '#a855f7' },
    { label: 'Chat', value: chat, color: '#10b981' },
  ]
  const max = Math.max(...rows.map(r => r.value), 1)
  return (
    <Card delay={delay}>
      <CardHeader icon="solar:chart-2-linear" title="Usage Breakdown" right={<ChipLabel>This month</ChipLabel>} />
      <div className="space-y-4">
        {rows.map(r => (
          <div key={r.label}>
            <div className="flex justify-between text-xs mb-2">
              <span style={{ color: '#6b7280' }}>{r.label}</span>
              <span className="font-semibold" style={{ color: '#111827' }}>{r.value.toLocaleString()}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.07)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(r.value / max) * 100}%`, backgroundColor: r.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 flex gap-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        {rows.map(r => (
          <div key={r.label} className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color }} />
            <span className="text-[11px]" style={{ color: '#9ca3af' }}>{r.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── 8. Docs by type ──────────────────────────────────────────────────────────
function DocsByType({ prd, quotation, prototype, specs, delay = 0 }: {
  prd: number; quotation: number; prototype: number; specs: number; delay?: number
}) {
  const data = [
    { name: 'PRD', value: prd, fill: '#38bdf8' },
    { name: 'Quotation', value: quotation, fill: '#818cf8' },
    { name: 'Prototype', value: prototype, fill: '#f472b6' },
    { name: 'Specs', value: specs, fill: '#fb923c' },
  ]
  return (
    <Card delay={delay}>
      <CardHeader icon="solar:document-linear" title="Documents by Type" right={<ChipLabel>All-time</ChipLabel>} />
      <ResponsiveContainer width="100%" height={148}>
        <BarChart data={data} layout="vertical" barSize={12} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatK} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<DarkTip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ─── 9. Payment funnel ────────────────────────────────────────────────────────
function PaymentFunnel({ initiated, settled, failed, rate, delay = 0 }: {
  initiated: number; settled: number; failed: number; rate: number; delay?: number
}) {
  const data = [
    { name: 'Initiated', value: initiated, fill: '#94a3b8' },
    { name: 'Settled', value: settled, fill: '#10b981' },
    { name: 'Failed', value: failed, fill: '#f87171' },
  ]
  return (
    <Card delay={delay}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <iconify-icon icon="solar:wallet-money-linear" width="15" style={{ color: '#9ca3af' }} />
          <span className="text-sm font-semibold" style={{ color: '#111827' }}>Payment Funnel</span>
        </div>
        <DeltaBadge n={rate} suffix="% settled" />
      </div>
      <ResponsiveContainer width="100%" height={148}>
        <BarChart data={data} barSize={44} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatK} />
          <Tooltip content={<DarkTip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 6 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<HealthState>({ status: 'loading' })

  const load = useCallback(async () => {
    try { setStats(await fetchAdminStats()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
  }, [])

  const loadHealth = useCallback(async () => {
    try { setHealth({ status: 'ok', data: await fetchAdminHealth() }) }
    catch { setHealth({ status: 'error' }) }
  }, [])

  useEffect(() => { void load(); void loadHealth() }, [load, loadHealth])

  if (error) return (
    <div className="m-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
  )
  if (!stats) return (
    <div className="flex h-full items-center justify-center gap-3 text-sm" style={{ color: '#9ca3af' }}>
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
      Loading…
    </div>
  )

  const fTotal = stats.paymentFunnel.initiated + stats.paymentFunnel.settled + stats.paymentFunnel.failed
  const settleRate = fTotal > 0 ? Math.round((stats.paymentFunnel.settled / fTotal) * 100) : 0
  const signupDelta = stats.newUsersThisMonth - stats.newUsersLastMonth

  return (
    <>
      <style>{css}</style>
      <div className="flex flex-col h-full">
        {/* header */}
        <header className="shrink-0 px-10 pt-10 pb-6" style={{ backgroundColor: '#f8fafc' }}>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#111827', fontFamily: "'Instrument Serif', serif" }}>
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#9ca3af' }}>Overview for this month.</p>
        </header>

        <div className="flex-1 overflow-y-auto px-10 pb-10">
          <div className="space-y-4">

            {/* expiry alert */}
            {stats.expiringSubsCount > 0 && (
              <div className="fade-up flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-3.5 text-sm text-yellow-700">
                <iconify-icon icon="solar:danger-triangle-linear" width="15" style={{ color: '#fbbf24', flexShrink: 0 }} />
                <span><strong className="font-semibold">{stats.expiringSubsCount}</strong> subscription{stats.expiringSubsCount > 1 ? 's' : ''} expire within 7 days.</span>
              </div>
            )}

            {/* ── Row 1: 4 stat tiles ── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile icon="solar:users-group-rounded-linear" label="Total users" value={stats.totalUsers.toLocaleString()} delay={40} />
              <StatTile icon="solar:crown-linear" label="Active Pro" value={stats.activeProSubs.toLocaleString()} delay={80} />
              <StatTile icon="solar:graph-up-linear" label="Revenue" value={formatRp(stats.revenueThisMonth)} delay={120} />
              <StatTile icon="solar:user-plus-linear" label="New signups" value={stats.newUsersThisMonth}
                delta={signupDelta} sub={`vs ${stats.newUsersLastMonth} last month`} delay={160} />
            </div>

            {/* ── Row 2: Revenue tracker (2/3) + Recent payments (1/3) ── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RevenueTracker trend={stats.revenueTrend ?? []} thisMonth={stats.revenueThisMonth} delay={200} />
              </div>
              <RecentPayments payments={stats.recentPayments} delay={240} />
            </div>

            {/* ── Row 3: Plan breakdown + Top users + System health ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <PlanBreakdown total={stats.totalUsers} pro={stats.activeProSubs} delay={280} />
              <TopUsers users={stats.topUsersByUsage ?? []} delay={320} />
              <SystemHealth health={health} delay={360} />
            </div>

            {/* ── Row 4: Usage + Docs by type + Payment funnel ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <UsageBreakdown doc={stats.usageThisMonth.doc} prototype={stats.usageThisMonth.prototype} chat={stats.usageThisMonth.chat} delay={400} />
              <DocsByType prd={stats.docsByType.prd} quotation={stats.docsByType.quotation} prototype={stats.docsByType.prototype} specs={stats.docsByType.specs} delay={440} />
              <PaymentFunnel initiated={stats.paymentFunnel.initiated} settled={stats.paymentFunnel.settled} failed={stats.paymentFunnel.failed} rate={settleRate} delay={480} />
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
