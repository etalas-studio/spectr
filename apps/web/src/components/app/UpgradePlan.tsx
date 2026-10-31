'use client'

import { Check, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../lib/i18n'
import { useSubscription } from '../../hooks/useSubscription'
import { getPlanMeta } from '../../lib/plans'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Plan picker used inside the account dialog and the standalone upgrade dialog.
// Checkout itself lives on /pay (Midtrans Snap).
export function UpgradePlan({ onNavigate }: { onNavigate?: () => void }) {
  const { t: tr } = useLanguage()
  const router = useRouter()
  const { data: sub } = useSubscription()
  const isPro = sub?.planSlug === 'pro'
  const starter = getPlanMeta('starter')!
  const pro = getPlanMeta('pro')!

  return (
    <div className="flex flex-col gap-3 px-6 pb-6">
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">{starter.name}</h3>
          {!isPro && <Badge>Current plan</Badge>}
        </div>
        <p className="mt-4 text-[28px] leading-none font-semibold tracking-tight">Free</p>
        <ul className="mt-4 flex flex-col gap-2.5">
          {starter.featureKeys.map((k) => (
            <li key={k} className="flex items-center gap-3 text-sm"><Check className="size-3.5 text-[var(--ap-ink-4,#6b7280)]" />{tr(k)}</li>
          ))}
        </ul>
      </Card>

      <Card className="relative overflow-hidden border-2 border-primary bg-gradient-to-b from-white to-[#eef3ff]">
        <span aria-hidden="true" className="pointer-events-none absolute -top-14 -right-10 size-36 rounded-full border border-primary/20 bg-primary/10" />
        <span aria-hidden="true" className="pointer-events-none absolute top-6 right-16 size-14 rounded-full border border-primary/25 bg-primary/10" />
        <div className="relative flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold"><Crown className="size-4 text-amber-500" fill="currentColor" />{pro.name}</h3>
          <Badge className="bg-primary font-semibold text-white">Best value</Badge>
        </div>
        <p className="relative mt-4 flex items-baseline gap-1.5">
          <span className="text-[28px] leading-none font-semibold tracking-tight">Rp {pro.amount.toLocaleString('id-ID')}</span>
          <span className="text-sm text-[var(--ap-ink-3,#5b6472)]">/ 30 days</span>
        </p>
        <ul className="relative mt-4 flex flex-col gap-2.5">
          {pro.featureKeys.map((k) => (
            <li key={k} className="flex items-center gap-3 text-sm"><Check className="size-3.5 text-primary" />{tr(k)}</li>
          ))}
        </ul>
        <Button
          disabled={isPro}
          onClick={() => { onNavigate?.(); router.push('/pay?plan=pro') }}
          variant="primary" className="relative mt-5 h-11 w-full text-sm font-semibold"
        >
          {isPro ? <Check /> : <Crown />} {isPro ? 'Current plan' : 'Upgrade to Pro'}
        </Button>
      </Card>

      <p className="px-4 text-center text-xs text-[var(--ap-ink-3,#5b6472)]">One-time payment via Midtrans. Renew manually after 30 days, no automatic billing.</p>
    </div>
  )
}
