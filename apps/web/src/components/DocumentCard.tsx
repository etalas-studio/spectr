import { useEffect, useState } from 'react'
import { ArrowRight, Eye } from 'lucide-react'
import { getDocument, type DocumentDetail } from '../api/documents'
import { typeMeta } from './app/meta'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface DocumentRefMeta {
  id: string
  type: string
  title: string
  commitSha: string | null
}

// Inline card shown in the chat under an AI message; opens the reader panel.
export default function DocumentCard({
  documentId,
  initial,
  onClick,
}: {
  documentId: string
  initial?: Partial<DocumentRefMeta>
  onClick: () => void
}) {
  const [doc, setDoc] = useState<DocumentDetail | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    getDocument(documentId)
      .then((d) => { if (!cancelled) setDoc(d) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [documentId])

  if (error) return <div className="text-sm text-[var(--ap-ink-4,#6b7280)]">Document unavailable</div>

  const type = doc?.type ?? initial?.type ?? ''
  const meta = typeMeta(type)
  const label = type ? (meta.label === 'Brief' ? type.toUpperCase() : meta.label) : 'Document'
  const title = doc?.title ?? initial?.title ?? 'Document'
  const commitSha = doc?.lastCommitSha ?? initial?.commitSha ?? null
  const Icon = meta.icon

  return (
    <Button variant="card" onClick={onClick} className="group max-w-md gap-0 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: meta.tint }}>
          <Icon className="size-[17px]" style={{ color: meta.ink }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] leading-3.5 font-semibold tracking-[0.12em] text-[var(--ap-ink-3,#5b6472)] uppercase">{label}</span>
          <span className="mt-0.5 block truncate text-sm font-semibold">{title}</span>
        </span>
        {commitSha && <Badge className="shrink-0 bg-[rgb(var(--ap-ov,0_0_0)/0.05)] font-mono text-[var(--ap-ink-3,#5b6472)]">{commitSha.slice(0, 7)}</Badge>}
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs font-medium text-[var(--ap-ink-3,#5b6472)]">
        <Eye className="size-3.5" />
        <span>Preview &amp; Download</span>
        <ArrowRight className="ml-auto size-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Button>
  )
}
