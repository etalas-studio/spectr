'use client'

import { useState } from 'react'
import { Crown, FileText, Lock, PenSquare, Smartphone, Sparkles, type LucideIcon } from 'lucide-react'
import { useLanguage } from '../../lib/i18n'
import type { LocalConversation } from '../../lib/conversations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BrandMark } from './BrandMark'
import { PromptBox, type PlanUsage } from './PromptBox'

const COPY = {
  en: {
    a: 'Turn Messy Briefs', b: 'into Execution-Ready', c: 'Specs', suggestions: 'Suggestions', upgrade: 'Upgrade',
    items: [
      { icon: FileText, title: 'PRD', text: 'Write a PRD for my new product feature' },
      { icon: PenSquare, title: 'Creative brief', text: 'Create a creative brief for a marketing campaign' },
      { icon: Smartphone, title: 'User flow', text: 'Design a user flow for a mobile app' },
    ],
  },
  id: {
    a: 'Ubah Brief Berantakan', b: 'jadi Siap Dieksekusi', c: 'Specs', suggestions: 'Saran', upgrade: 'Upgrade',
    items: [
      { icon: FileText, title: 'PRD', text: 'Buatkan PRD untuk fitur baru produk gue' },
      { icon: PenSquare, title: 'Creative brief', text: 'Tulis creative brief untuk kampanye marketing' },
      { icon: Smartphone, title: 'User flow', text: 'Rancang user flow untuk aplikasi mobile' },
    ],
  },
} satisfies Record<string, { a: string; b: string; c: string; suggestions: string; upgrade: string; items: { icon: LucideIcon; title: string; text: string }[] }>

export default function Home({
  usage, onSuccess, projectId, projectTitle, onClearProject, onUpgrade,
}: {
  usage: PlanUsage
  onSuccess: (t: LocalConversation) => void
  projectId?: string | null
  projectTitle?: string | null
  onClearProject?: () => void
  onUpgrade: () => void
}) {
  const { lang } = useLanguage()
  const c = COPY[lang]
  const [prefill, setPrefill] = useState({ text: '', n: 0 })

  return (
    <div className="ap-scroll relative z-[1] flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-4 pb-10">
      <div className="my-auto w-full max-w-[880px] py-6">
        <div className="mb-4 flex justify-center">
          <Badge className="gap-2 border border-white/75 bg-white/45 px-3.5 py-1.5 text-[13px] text-black/60 shadow-[0_2px_10px_rgba(17,24,39,0.06)] backdrop-blur-md">
            {usage.isPro ? <Crown className="size-[13px] text-amber-500" fill="currentColor" /> : <Lock className="size-[13px] text-black/40" />}
            {usage.isPro ? 'Pro Plan' : 'Starter Plan'}
            {!usage.isPro && <Button variant="link" onClick={onUpgrade} className="h-auto p-0 text-[13px] font-semibold text-[#1e40af]">{c.upgrade}</Button>}
          </Badge>
        </div>
        <div className="mb-5 flex justify-center"><BrandMark size="lg" /></div>
        <h2 className="ap-headline mx-auto mb-9 max-w-[560px]">
          {c.a}<br /><span className="ap-headline__serif">{c.b}<br /><em>{c.c}</em></span>
        </h2>

        <PromptBox onSuccess={onSuccess} usage={usage} projectId={projectId} projectTitle={projectTitle} onClearProject={onClearProject} prefill={prefill} />

        <div className="mt-5 mb-3 flex items-center gap-2 px-1 text-sm font-medium"><Sparkles className="size-4 text-gray-500" />{c.suggestions}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {c.items.map((s) => (
            <Button key={s.title} variant="card" className="ap-sug" onClick={() => setPrefill((p) => ({ text: s.text, n: p.n + 1 }))}>
              <i aria-hidden="true" /><i aria-hidden="true" />
              <span className="ap-sug__ic"><s.icon className="size-5" /></span>
              <span className="relative block">
                <span className="block text-[15px] leading-[22px] font-semibold">{s.title}</span>
                <span className="mt-1 block text-sm leading-[22px] text-gray-600">{s.text}</span>
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
