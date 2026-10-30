'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CreditCard, Crown, FileText, Wallet, ArrowLeftRight, LineChart, Server, TriangleAlert, UserPlus, UsersRound, BarChart3, CalendarDays, CalendarRange, CircleCheck, CircleX, Check, Clock, Ellipsis, EllipsisVertical, Info, RefreshCw, LayoutGrid, type LucideIcon } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  fetchAdminStats, fetchAdminHealth,
  type AdminStats, type AdminStatsPayment, type TopUser, type RevenueTrendPoint, type AdminHealth, type HealthStatus,
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
    <div className={`fade-up rounded-2xl border border-black/[0.08] bg-white p-5 ${className}`}
      style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function CardHeader({ icon: Icon, title, right }: { icon: LucideIcon; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="size-[15px] text-gray-400" />
        <span className="text-sm font-semibold text-[#111827]">{title}</span>
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-xs font-medium text-gray-400 transition-colors hover:text-[#265ee4]">
      See All
    </Link>
  )
}

const PTAB_ICON: Record<string, LucideIcon> = { All: LayoutGrid, Settled: CircleCheck, Pending: Clock, Failed: CircleX }

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
    settled: 'bg-emerald-50 text-emerald-600',
    pending: 'bg-amber-50 text-amber-600',
    failed:  'bg-red-50 text-red-500',
  }
  const label: Record<string, string> = { settled: 'Settled', pending: 'Pending', failed: 'Failed' }
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
const BLUE = '#265ee4'
const BLUE_SOFT = '#bcd0f8'

function MiniBars({ values, count = 7 }: { values: number[]; count?: number }) {
  // Always render `count` bars so the tile never looks empty: pad with zeros and give zero values a small stub.
  const padded = [...Array(Math.max(0, count - values.length)).fill(0), ...values.slice(-count)]
  const max = Math.max(...padded, 0)
  const data = padded.map((v, i) => ({ i, v: max > 0 ? Math.max(v, max * 0.14) : 1 }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }} barCategoryGap={3}>
        <Bar dataKey="v" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.i} fill={d.i % 2 === 1 ? BLUE : BLUE_SOFT} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function MiniLine({ values, count = 6 }: { values: number[]; count?: number }) {
  // Pad with zeros so there is always a line to draw, even with a single data point.
  const padded = [...Array(Math.max(0, count - values.length)).fill(0), ...values.slice(-count)]
  const data = padded.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id="mini-line" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.22} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={BLUE} strokeWidth={1.75} fill="url(#mini-line)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function StatTile({ label, value, icon: Icon, caption, chart, delta, delay = 0 }: {
  label: string; value: string | number; icon: LucideIcon
  caption?: string; chart?: React.ReactNode; delta?: number; delay?: number
}) {
  return (
    <Card delay={delay} className="!rounded-[20px] !p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-[17px] leading-6 font-medium text-gray-400">
          {label}
          <Info className="size-4 shrink-0" aria-hidden />
        </span>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-black/[0.08] text-[#265ee4]">
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-2xl leading-9 font-semibold tracking-tight whitespace-nowrap text-[#111827]">{value}</div>
        </div>
        {chart && <div className="h-14 w-24 shrink-0">{chart}</div>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        {delta !== undefined && <DeltaBadge n={delta} suffix="" />}
        {caption && <span className="truncate">{caption}</span>}
      </div>
    </Card>
  )
}

// ─── 2. Revenue tracker ───────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function RevenueTracker({ trend, thisMonth, delay = 0 }: {
  trend: RevenueTrendPoint[]; thisMonth: number; delay?: number
}) {
  const [period, setPeriod] = useState('6M')
  const n = period === '1M' ? 1 : period === '3M' ? 3 : 6
  // Fill the last `n` calendar months (zero where the API has no row) so the axis always looks complete.
  const byMonth = new Map(trend.map(t => [t.month.slice(0, 7), t.revenue]))
  const now = new Date()
  const data = Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { name: MONTHS[d.getMonth()], value: byMonth.get(key) ?? 0 }
  })
  const last = data[data.length - 1]?.value ?? 0
  const prev = data[data.length - 2]?.value ?? 0
  const delta = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null

  return (
    <Card delay={delay} className="h-full !rounded-[20px] !p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-[20px] leading-7 font-medium text-gray-400">
          Revenue Tracker
          <Info className="size-4 shrink-0" aria-hidden />
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Chart range" className="text-[#111827]" />}>
            <EllipsisVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-[12px] p-1.5">
            {['1M', '3M', '6M'].map(o => (
              <DropdownMenuItem key={o} onClick={() => setPeriod(o)} className="h-9 gap-2">
                <CalendarRange /> Last {o === '1M' ? 'month' : o.replace('M', ' months')}
                {period === o && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[28px] leading-9 font-semibold tracking-tight text-[#111827]">{formatRp(thisMonth)}</span>
        {delta !== null && <DeltaBadge n={delta} />}
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <span className="inline-flex items-center gap-2 text-sm text-[#111827]">
          <span className="h-3 w-6 rounded-full" style={{ background: BLUE }} />Latest month
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-[#111827]">
          <span className="h-3 w-6 rounded-full" style={{ background: BLUE_SOFT }} />Previous months
        </span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 16, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="rgba(17,24,39,0.07)" />
          <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 13, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatK} width={54} />
          <Tooltip cursor={{ fill: 'rgba(17,24,39,0.04)' }} content={<DarkTip fmt={formatRp} />} />
          <Bar dataKey="value" radius={[10, 10, 10, 10]} minPointSize={6} isAnimationActive={false}>
            {data.map((d, i) => <Cell key={d.name + i} fill={i === data.length - 1 ? BLUE : BLUE_SOFT} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ─── 3. Recent payments ───────────────────────────────────────────────────────
const PTABS = ['All', 'Settled', 'Pending', 'Failed']
const PMAP: Record<string, AdminStatsPayment['status']> = { Settled: 'settled', Pending: 'pending', Failed: 'failed' }

function RecentPayments({ payments, delay = 0 }: { payments: AdminStatsPayment[]; delay?: number }) {
  const [tab, setTab] = useState('All')
  const list = (tab === 'All' ? payments : payments.filter(p => p.status === PMAP[tab])).slice(0, 5)

  return (
    <Card delay={delay} className="h-full">
      <CardHeader icon={CreditCard} title="Recent Payments" right={<SeeAll href="/admin/payments" />} />
      {/* tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList className="w-full gap-0.5 rounded-[12px] p-0.5">
          {PTABS.map(t => { const I = PTAB_ICON[t]; return <TabsTrigger key={t} value={t} className="h-8 flex-1 rounded-[10px] px-0 text-xs"><I className="size-3.5" />{t}</TabsTrigger> })}
        </TabsList>
      </Tabs>
      {list.length === 0 ? (
        <p className="py-6 text-center text-xs" style={{ color: '#9ca3af' }}>No payments found.</p>
      ) : (
        <div>
          {list.map((p, i) => (
            <div key={p.orderId} className="flex items-center gap-3 py-2.5"
              style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(38,94,228,0.1)' }}>
                <ArrowLeftRight className="size-3.5 text-[#265ee4]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: '#111827' }}>
                  {p.userEmail ?? p.orderId.slice(0, 14) + '…'}
                </div>
                <div className="text-[11px]" style={{ color: '#9ca3af' }}>
                  {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill s={p.status} />
                <div className="text-xs font-semibold" style={{ color: '#111827' }}>{formatRp(Number(p.grossAmount))}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── 4. Plan distribution (donut) ─────────────────────────────────────────────
function PlanBreakdown({ total, pro, delay = 0 }: { total: number; pro: number; delay?: number }) {
  const free = Math.max(0, total - pro)
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
  const rows = [
    { label: 'Pro', count: pro, color: BLUE },
    { label: 'Free', count: free, color: BLUE_SOFT },
  ]
  const donut = total > 0 ? rows.map(r => ({ name: r.label, value: r.count, fill: r.color })) : [{ name: 'Empty', value: 1, fill: '#e5e7eb' }]

  return (
    <Card delay={delay} className="!rounded-[20px] !p-5">
      <ChartHeader
        title="Plan Distribution"
        subtitle="Pro vs free users"
        right={
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon-lg" aria-label="Plan actions" className="size-10 rounded-full" />}>
              <Ellipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-[12px] p-1.5">
              <DropdownMenuItem render={<Link href="/admin/users" />} className="h-9 gap-2"><UsersRound /> View users</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <div className="relative mx-auto mt-4 h-[200px] w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={donut} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" startAngle={90} endAngle={-270}
              paddingAngle={total > 0 && pro > 0 && free > 0 ? 4 : 0} cornerRadius={10} stroke="none" isAnimationActive={false}>
              {donut.map(d => <Cell key={d.name} fill={d.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[34px] leading-10 font-semibold tracking-tight text-[#111827]">{pct(pro)}%</span>
          <span className="text-base text-gray-500">Pro users</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {rows.map(r => (
          <div key={r.label} className="flex items-center gap-2.5">
            <span className="size-3.5 shrink-0 rounded-[4px]" style={{ background: r.color }} />
            <span className="text-sm text-[#111827]">{r.label}</span>
            <span className="text-sm text-gray-500">{pct(r.count)}%</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── 5. Top users ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#265ee4', '#8b5cf6', '#f59e0b', '#10b981', '#f97316']

function TopUsers({ users, delay = 0 }: { users: TopUser[]; delay?: number }) {
  const max = Math.max(...users.map(u => u.totalUsage), 1)
  return (
    <Card delay={delay}>
      <CardHeader icon={UsersRound} title="Top Users" right={<SeeAll href="/admin/users" />} />
      {users.length === 0 ? (
        <p className="py-6 text-center text-xs" style={{ color: '#9ca3af' }}>No usage data yet.</p>
      ) : (
        <div>
          {users.map((u, i) => (
            <div key={u.email} className="flex items-center gap-3 py-2"
              style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
              <Avatar className="size-9">
                {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                <AvatarFallback className="text-sm text-white" style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {(u.username || u.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[#111827]">
                  {u.username || u.email.split('@')[0]}
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-black/[0.07]">
                  <div className="h-full rounded-full bg-[#265ee4]" style={{ width: `${(u.totalUsage / max) * 100}%` }} />
                </div>
              </div>
              <span className="ml-2 w-10 shrink-0 text-right text-sm font-semibold text-[#111827]">{u.totalUsage}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── 6. System health ─────────────────────────────────────────────────────────
type HealthState = { status: 'loading' } | { status: 'error' } | { status: 'ok'; data: AdminHealth }

// Semicircle of rounded radial dashes; the first `pct`% are filled.
function DashGauge({ pct, color }: { pct: number; color: string }) {
  const N = 13
  const filled = Math.round((pct / 100) * N)
  const cx = 100, cy = 100, r1 = 62, r2 = 92
  return (
    <svg viewBox="0 0 200 108" className="h-full w-full" aria-hidden>
      {Array.from({ length: N }, (_, i) => {
        const a = Math.PI - (i / (N - 1)) * Math.PI
        const x1 = cx + r1 * Math.cos(a), y1 = cy - r1 * Math.sin(a)
        const x2 = cx + r2 * Math.cos(a), y2 = cy - r2 * Math.sin(a)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i < filled ? color : '#eceef2'} strokeWidth={10} strokeLinecap="round" />
      })}
    </svg>
  )
}

const HEALTH_COLOR: Record<HealthStatus, string> = { ok: '#10b981', degraded: '#f59e0b', down: '#ef4444' }

function SystemHealth({ health, onRefresh, delay = 0 }: { health: HealthState; onRefresh: () => void; delay?: number }) {
  const fmtUp = (s: number) => {
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`
  }
  const data = health.status === 'ok' ? health.data : null
  const pct = data?.score ?? 0
  const color = data ? HEALTH_COLOR[data.status] : '#ef4444'
  const subtitle = health.status === 'error' ? 'Service unreachable'
    : !data ? 'Checking…'
    : data.status === 'ok' ? 'All systems operational'
    : data.status === 'degraded' ? 'Some systems degraded'
    : 'Some systems down'
  return (
    <Card delay={delay} className="flex flex-col !rounded-[20px] !p-5">
      <ChartHeader
        title="System Health"
        subtitle={subtitle}
        right={
          <Button variant="outline" size="icon-lg" aria-label="Refresh health" className="size-10 rounded-full" onClick={onRefresh}>
            <RefreshCw />
          </Button>
        }
      />
      <div className="relative mx-auto mt-3 h-[124px] w-[230px]">
        <DashGauge pct={pct} color={color} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <span className="text-[30px] leading-9 font-semibold tracking-tight text-[#111827]">{data ? `${pct}%` : '-'}</span>
        </div>
      </div>
      <p className="mt-1 text-center text-sm text-gray-500">Health score{data ? ` · up ${fmtUp(data.uptimeSeconds)}` : ''}</p>
      <ul className="mt-auto space-y-2 pt-4">
        {(data?.checks ?? []).map(c => (
          <li key={c.id} className="flex items-center gap-2.5 text-sm">
            <span className="size-2 shrink-0 rounded-full" style={{ background: HEALTH_COLOR[c.status] }} aria-label={c.status} />
            <span className="font-medium text-[#111827]">{c.name}</span>
            <span className="ml-auto truncate text-xs text-gray-400" title={c.detail}>{c.detail}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ─── 7. Usage breakdown ───────────────────────────────────────────────────────
type BarDatum = { name: string; value: number; fill: string }

function ChartHeader({ title, subtitle, right }: { title: string; subtitle: string; right: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-base leading-6 font-semibold text-[#111827]">{title}</h3>
        <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
      </div>
      {right}
    </div>
  )
}

function RangeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[12px] border border-black/[0.1] bg-white px-3.5 text-sm font-medium text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.06)]">
      <CalendarDays className="size-4" />{label}
    </span>
  )
}

// Dashed grid, rounded bars sitting on a light track, dot legend underneath.
function TrackBars({ data, height = 200, barSize = 44 }: { data: BarDatum[]; height?: number; barSize?: number }) {
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barSize={barSize} margin={{ top: 16, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(17,24,39,0.12)" strokeDasharray="4 4" />
          <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={formatK} width={40} allowDecimals={false} />
          <Tooltip content={<DarkTip />} cursor={false} />
          <Bar dataKey="value" radius={[5, 5, 0, 0]} minPointSize={4} isAnimationActive={false}
            background={{ fill: 'rgba(38,94,228,0.08)', radius: [5, 5, 0, 0] as unknown as number }}>
            {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}

function UsageBreakdown({ doc, prototype, chat, delay = 0 }: {
  doc: number; prototype: number; chat: number; delay?: number
}) {
  const data: BarDatum[] = [
    { name: 'Documents', value: doc, fill: BLUE },
    { name: 'Prototypes', value: prototype, fill: '#7c9cf0' },
    { name: 'Chat', value: chat, fill: BLUE_SOFT },
  ]
  return (
    <Card delay={delay} className="!rounded-[20px] !p-5">
      <ChartHeader title="Usage Breakdown" subtitle="Generations by type" right={<RangeChip label="This month" />} />
      <TrackBars data={data} />
    </Card>
  )
}

// ─── 8. Docs by type ──────────────────────────────────────────────────────────
function DocsByType({ prd, quotation, prototype, specs, delay = 0 }: {
  prd: number; quotation: number; prototype: number; specs: number; delay?: number
}) {
  const data = [
    { name: 'PRD', value: prd, fill: '#7b93f5' },
    { name: 'Quotation', value: quotation, fill: '#9dd8f9' },
    { name: 'Prototype', value: prototype, fill: '#bfaef8' },
    { name: 'Specs', value: specs, fill: '#b9e0dc' },
  ]
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <Card delay={delay} className="flex flex-col">
      <CardHeader icon={FileText} title="Documents by Type" right={<ChipLabel>All-time</ChipLabel>} />
      {/* One segmented bar: each column's width follows its share of all documents. */}
      <div className="flex flex-1 items-center gap-2">
        {data.map(d => {
          const share = total > 0 ? d.value / total : 1 / data.length
          return (
            <div key={d.name} className="min-w-[80px]" style={{ flex: `${Math.max(share, 0.08)} 1 0%` }}>
              <p className="truncate text-sm text-[#111827]">{d.name}</p>
              <div className="mt-1.5 flex items-center gap-2 border-l-2 pl-2" style={{ borderColor: d.fill }}>
                <span className="text-sm font-semibold text-[#111827]">{d.value.toLocaleString()}</span>
                <span className="text-xs text-gray-400">{Math.round(share * (total > 0 ? 100 : 0))}%</span>
              </div>
              <div className="mt-3 h-5 rounded-[6px]" style={{ background: d.fill }} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── 9. Payment funnel ────────────────────────────────────────────────────────
function PaymentFunnel({ initiated, settled, failed, rate, delay = 0 }: {
  initiated: number; settled: number; failed: number; rate: number; delay?: number
}) {
  const data: BarDatum[] = [
    { name: 'Initiated', value: initiated, fill: BLUE_SOFT },
    { name: 'Settled', value: settled, fill: BLUE },
    { name: 'Failed', value: failed, fill: '#f87171' },
  ]
  return (
    <Card delay={delay} className="!rounded-[20px] !p-5">
      <ChartHeader title="Payment Funnel" subtitle="Payment attempts by outcome" right={<DeltaBadge n={rate} suffix="% settled" />} />
      <TrackBars data={data} />
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<HealthState>({ status: 'loading' })

  const load = useCallback(async () => {
    try { setStats(await fetchAdminStats()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
  }, [])

  const loadHealth = useCallback(async () => {
    try { setHealth({ status: 'ok', data: await fetchAdminHealth() }) }
    catch { setHealth({ status: 'error' }) }
  }, [])

  useEffect(() => {
    void load(); void loadHealth()
    // Keep the dashboard live: refresh every 30s while the tab is visible, and on return to the tab.
    const tick = () => { if (document.visibilityState === 'visible') { void load(); void loadHealth() } }
    const id = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [load, loadHealth])

  if (error && !stats) return (
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
  const trends = stats.monthlyTrends ?? []

  return (
    <>
      <style>{css}</style>
      <div className="flex flex-col h-full">
        {/* header */}
        <header className="shrink-0 px-6 pt-2 pb-5">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111827]">Dashboard</h1>
          <p className="mt-1.5 text-sm text-black/45">Overview for this month.</p>
        </header>

        <div className="flex-1 overflow-y-auto px-10 pb-10">
          <div className="space-y-4">

            {/* expiry alert */}
            {stats.expiringSubsCount > 0 && (
              <div className="fade-up flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-3.5 text-sm text-yellow-700">
                <TriangleAlert className="size-[15px] shrink-0 text-amber-400" />
                <span><strong className="font-semibold">{stats.expiringSubsCount}</strong> subscription{stats.expiringSubsCount > 1 ? 's' : ''} expire within 7 days.</span>
              </div>
            )}

            {/* ── Row 1: 4 stat tiles ── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile icon={UsersRound} label="Total users" value={stats.totalUsers.toLocaleString()}
                caption={`${stats.starterUsers.toLocaleString()} Starter, ${stats.activeProSubs.toLocaleString()} Pro`}
                chart={<MiniBars values={trends.map(t => t.totalUsers)} count={6} />} delay={40} />
              <StatTile icon={Crown} label="Active Pro" value={stats.activeProSubs.toLocaleString()}
                caption={`${stats.paymentFunnel.settled} settled of ${stats.paymentFunnel.initiated} payments`}
                chart={<MiniBars values={trends.map(t => t.settledPayments)} count={6} />} delay={80} />
              <StatTile icon={LineChart} label="Revenue" value={formatRp(stats.revenueThisMonth)}
                caption="Settled this month"
                chart={<MiniLine values={(stats.revenueTrend ?? []).map(t => t.revenue)} />} delay={120} />
              <StatTile icon={UserPlus} label="New signups" value={stats.newUsersThisMonth}
                delta={signupDelta} caption={`vs ${stats.newUsersLastMonth} last month`}
                chart={<MiniBars values={trends.map(t => t.newUsers)} count={6} />} delay={160} />
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
              <SystemHealth health={health} onRefresh={() => void loadHealth()} delay={360} />
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
