'use client'

import { useState } from 'react'
import { Link2, Lock } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioCard, RadioGroup } from '@/components/ui/radio-group'
import { useLanguage } from '../../lib/i18n'

export function ShareDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (visibility: 'private' | 'shared') => Promise<void> }) {
  const { t: tr } = useLanguage()
  const [vis, setVis] = useState<'private' | 'shared'>('shared')
  const [busy, setBusy] = useState(false)
  const options = [
    { key: 'private' as const, icon: Lock, title: tr('share_private_title'), desc: tr('share_private_desc') },
    { key: 'shared' as const, icon: Link2, title: tr('share_shared_title'), desc: tr('share_shared_desc') },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeClassName="top-6 right-5" className="gap-0 rounded-2xl p-6 sm:max-w-[448px]">
        <DialogTitle className="text-lg leading-7 font-semibold tracking-tight">{tr('share_title')}</DialogTitle>
        <DialogDescription className="mt-0.5 mb-5 text-sm text-[var(--ap-ink-3,#5b6472)]">{tr('share_subtitle')}</DialogDescription>
        <RadioGroup value={vis} onValueChange={(v) => setVis(v as 'private' | 'shared')} aria-label={tr('share_title')}>
          {options.map((o) => (
            <RadioCard key={o.key} value={o.key}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--ap-ov,0_0_0)/0.06)] text-[var(--ap-ink-3,#5b6472)] group-data-checked/radio:bg-primary/15 group-data-checked/radio:text-primary"><o.icon className="size-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{o.title}</span>
                <span className="block text-xs text-[var(--ap-ink-3,#5b6472)]">{o.desc}</span>
              </span>
            </RadioCard>
          ))}
        </RadioGroup>
        <div className="mt-6 flex justify-end">
          <Button
            disabled={busy}
            variant="primary" className="h-10 px-5 text-sm font-semibold"
            onClick={async () => { setBusy(true); try { await onCreate(vis) } finally { setBusy(false) } }}
          >
            <Link2 /> {tr('share_create_link')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
