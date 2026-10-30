import { describe, expect, it } from 'vitest'
import { buildNotifications } from './notifications'
import type { AdminHealth, AdminStats, AdminStatsPayment } from '../../api/admin'

const NOW = new Date('2026-10-30T12:00:00Z').getTime()
const pay = (over: Partial<AdminStatsPayment>): AdminStatsPayment => ({
  orderId: 'o1', userEmail: 'a@b.c', planSlug: 'pro', grossAmount: '50000', transactionStatus: 'settlement',
  localStatus: 'paid', status: 'settled', fraudStatus: null, createdAt: '2026-10-29T12:00:00Z', ...over,
})
const stats = (over: Partial<AdminStats> = {}): AdminStats => ({
  totalUsers: 0, activeProSubs: 0, starterUsers: 0, revenueThisMonth: 0, usageThisMonth: { doc: 0, prototype: 0, chat: 0 },
  recentPayments: [], docsByType: { prd: 0, quotation: 0, prototype: 0, specs: 0 },
  paymentFunnel: { initiated: 0, settled: 0, failed: 0 }, expiringSubsCount: 0, newUsersThisMonth: 0, newUsersLastMonth: 0, ...over,
})
const health = (status: AdminHealth['status']): AdminHealth => ({
  ok: status !== 'down', status, score: 50, dbMs: 1, uptimeSeconds: 1,
  checks: [{ id: 'ai', name: 'AI engine', status, detail: '1/2 providers connected' }, { id: 'database', name: 'Database', status: 'ok', detail: '1ms query' }],
})

describe('buildNotifications', () => {
  it('is empty when everything is healthy and quiet', () => {
    expect(buildNotifications(stats(), health('ok'), NOW)).toEqual([])
  })

  it('reports only the failing health checks', () => {
    const [n] = buildNotifications(null, health('degraded'), NOW)
    expect(n).toMatchObject({ kind: 'health', tone: 'amber', title: 'System degraded' })
    expect(n.detail).toContain('AI engine')
    expect(n.detail).not.toContain('Database')
  })

  it('lists recent settled and failed payments, skips pending and stale ones', () => {
    const items = buildNotifications(stats({
      recentPayments: [
        pay({ orderId: 'a', status: 'settled' }),
        pay({ orderId: 'b', status: 'failed', localStatus: 'failed' }),
        pay({ orderId: 'c', status: 'pending' }),
        pay({ orderId: 'd', createdAt: '2026-10-01T00:00:00Z' }),
      ],
    }), null, NOW)
    expect(items.map((i) => i.id)).toEqual(['pay:b:failed', 'pay:a:settled'])
  })

  it('flags expiring subscriptions and orders red before amber before green', () => {
    const items = buildNotifications(stats({
      expiringSubsCount: 2,
      recentPayments: [pay({ orderId: 'a' }), pay({ orderId: 'b', status: 'failed' })],
    }), health('down'), NOW)
    expect(items.map((i) => i.tone)).toEqual(['red', 'red', 'amber', 'green'])
    expect(items.find((i) => i.kind === 'subscriptions')?.title).toBe('2 subscriptions expiring soon')
  })
})
