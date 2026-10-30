import { useEffect, useState } from 'react'
import { marked } from 'marked'
import { ChevronDown, Download, ExternalLink, MessageCircle } from 'lucide-react'
import { getDocument, documentExportUrl, type DocumentDetail } from '../api/documents'
import { apiUrl } from '../api/base'
import { typeMeta, DOWNLOAD_FORMATS } from './app/meta'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// Right-hand sheet that reads a document (markdown) or previews a prototype (iframe).
// Opened from the chat card or from Artifacts; `onGoToChat` adds the Artifacts-style footer.
export default function DocumentReaderPanel({
  documentId,
  onClose,
  onGoToChat,
}: {
  documentId: string | null
  onClose: () => void
  onGoToChat?: (doc: DocumentDetail) => void
}) {
  const [doc, setDoc] = useState<DocumentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!documentId) return
    let cancelled = false
    setDoc(null)
    setLoading(true)
    setError(false)
    getDocument(documentId)
      .then((d) => { if (!cancelled) setDoc(d) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [documentId])

  if (!documentId) return null

  const isPrototype = doc?.type === 'prototype'
  const meta = typeMeta(doc?.type)
  const Icon = meta.icon
  const content = doc?.content ?? ''
  const base = (doc?.previewUrl ?? apiUrl(`/p/${documentId}`)).replace(/\/$/, '')
  const previewSrc = `${base}/`
  const date = doc ? new Date(doc.createdAt ?? doc.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const fromArtifacts = !!onGoToChat

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent showCloseButton className="max-w-[672px]">
        <SheetHeader className="pr-14">
          {fromArtifacts && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: meta.tint }}>
              <Icon className="size-4" style={{ color: meta.ink }} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {!fromArtifacts && <p className="text-[10px] leading-3.5 font-semibold tracking-[0.12em] text-gray-500 uppercase">{meta.label}</p>}
            <SheetTitle>{doc?.title ?? 'Document'}</SheetTitle>
            {fromArtifacts && doc && <SheetDescription>{meta.label} · {date}</SheetDescription>}
          </div>
          {!fromArtifacts && doc && !isPrototype && (
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="primary" className="h-8 px-3 text-xs font-semibold" render={<a href={documentExportUrl(doc.id, 'md')} />}>Download MD</Button>
              <Button size="sm" variant="outline" className="h-8 rounded-[12px] px-3 text-xs font-medium" render={<a href={documentExportUrl(doc.id, 'pdf')} />}>PDF</Button>
              <Button size="sm" variant="outline" className="h-8 rounded-[12px] px-3 text-xs font-medium" render={<a href={documentExportUrl(doc.id, 'doc')} />}>DOCX</Button>
            </div>
          )}
          {!fromArtifacts && doc && isPrototype && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-[12px] px-3 text-xs font-medium" render={<a href={previewSrc} target="_blank" rel="noreferrer" />}>
              <ExternalLink className="size-3.5" /> Open in new tab
            </Button>
          )}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-6 text-sm text-gray-400">Loading…</p>
          ) : error ? (
            <p className="p-6 text-sm text-destructive">Failed to load document.</p>
          ) : isPrototype ? (
            <iframe src={previewSrc} title={doc?.title ?? 'Prototype preview'} className="h-full min-h-[480px] w-full border-0" />
          ) : (
            <div className="spectr-output ap-prose px-6 py-6" dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }} />
          )}
        </div>

        {fromArtifacts && doc && (
          <SheetFooter>
            <Button variant="primary" className="h-10 gap-2 px-4 text-sm font-semibold" onClick={() => onGoToChat(doc)}><MessageCircle /> Go to chat</Button>
            {isPrototype ? (
              <Button variant="outline" className="h-10 gap-2 rounded-[12px] px-4 text-sm font-semibold" render={<a href={previewSrc} target="_blank" rel="noreferrer" />}><ExternalLink /> Open in new tab</Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-gray-50"><Download className="size-4" /> Download <ChevronDown className="size-3.5 text-gray-400" /></DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-44">
                  {DOWNLOAD_FORMATS.map((f) => (
                    <DropdownMenuItem key={f.ext} render={<a href={documentExportUrl(doc.id, f.ext)} download />}>{f.label}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
