'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowUp, File as FileIcon, Image as ImageIcon, Loader2, Paperclip, X } from 'lucide-react'
import { createConversationLocal, type LocalConversation, type ConversationType } from '../../lib/conversations'
import { uploadAttachment, createMessage, type Attachment } from '../../api/conversations'
import { DeliverableTypeSelect } from '../DeliverableTypeSelect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '../../lib/i18n'
import { dataUrlToBlob, type AttachedFile } from './ChatView'

export interface PlanUsage { used: number; prototypeUsed: number; chatUsed: number; limit: number | null; prototypeLimit: number | null; chatLimit: number | null; isPro: boolean }
export function isAtLimit(u: PlanUsage): boolean {
  return !u.isPro && u.limit !== null && u.used >= u.limit
}

function loadDraft(): { prompt: string; attachments: AttachedFile[]; activeType: ConversationType | null } {
  try {
    const raw = localStorage.getItem('spectr_draft')
    if (!raw) return { prompt: '', attachments: [], activeType: null }
    localStorage.removeItem('spectr_draft')
    const parsed = JSON.parse(raw) as { prompt?: string; attachments?: AttachedFile[]; activeType?: ConversationType }
    return { prompt: parsed.prompt ?? '', attachments: parsed.attachments ?? [], activeType: parsed.activeType ?? null }
  } catch {
    return { prompt: '', attachments: [], activeType: null }
  }
}

export interface PromptBoxProps {
  defaultType?: ConversationType
  onSuccess: (t: LocalConversation) => void
  usage: PlanUsage
  projectId?: string | null
  projectTitle?: string | null
  onClearProject?: () => void
  /** Setting a new `n` replaces the textarea (used by the suggestion cards). */
  prefill?: { text: string; n: number }
}

export function PromptBox({ defaultType = 'general', onSuccess, usage, projectId, projectTitle, onClearProject, prefill }: PromptBoxProps) {
  const { lang, t: tr } = useLanguage()
  const [draft] = useState(loadDraft)
  const [prompt, setPrompt] = useState(draft.prompt)
  const [pendingType, setPendingType] = useState<string>(draft.activeType ?? (defaultType === 'general' ? '' : defaultType))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<AttachedFile[]>(draft.attachments)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const atLimit = isAtLimit(usage)

  useEffect(() => {
    if (prefill && prefill.n > 0) { setPrompt(prefill.text); taRef.current?.focus() }
  }, [prefill])

  const addFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => setAttachments((p) => [...p, { name: file.name, type: file.type, dataUrl: reader.result as string }])
      reader.readAsDataURL(file)
    })
  }, [])
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { addFiles(e.target.files ?? []); e.target.value = '' }, [addFiles])
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const imgs = Array.from(e.clipboardData.items).filter((i) => i.kind === 'file' && i.type.startsWith('image/')).map((i) => i.getAsFile()).filter((f): f is File => f !== null)
    if (imgs.length > 0) addFiles(imgs)
  }, [addFiles])

  const [isDragging, setIsDragging] = useState(false)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (Array.from(e.dataTransfer.items).some((i) => i.kind === 'file')) { e.preventDefault(); setIsDragging(true) }
  }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleSubmit = async () => {
    if (!prompt.trim() || atLimit) return
    setIsSubmitting(true)
    setError(null)
    try {
      const local = await createConversationLocal({ type: 'general', pendingType: pendingType || undefined, summary: prompt.trim(), description: prompt.trim(), projectId: projectId ?? undefined })
      const uploaded: Attachment[] = []
      for (const a of attachments) {
        try { uploaded.push(await uploadAttachment(dataUrlToBlob(a.dataUrl), a.name, local.id)) } catch { /* skip failed upload */ }
      }
      await createMessage(local.id, { content: prompt.trim(), attachmentIds: uploaded.map((a) => a.id) })
      setPrompt('')
      setAttachments([])
      onSuccess(local)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'active subscription required') setError(tr('dash_expired_error'))
      else if (msg === 'monthly quota reached') setError(tr('plan_limit_desc'))
      else if (msg === 'prototype quota reached') setError(tr('prototype_quota_reached'))
      else if (msg === 'project not found') { setError(tr('dash_project_gone')); onClearProject?.() }
      else setError(msg || tr('dash_generic_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSend = !!prompt.trim() && !atLimit && !isSubmitting

  return (
    <div
      className={`ap-glass w-full transition-shadow ${isDragging ? 'ring-2 ring-primary' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {projectId && projectTitle && (
        <div className="flex items-center gap-3 rounded-t-[18px] border-b border-[rgb(var(--ap-ov,0_0_0)/0.06)] bg-[rgb(var(--ap-ov,0_0_0)/0.03)] px-5 py-2.5">
          <p className="truncate text-xs text-[var(--ap-ink-3,#5b6472)]">{tr('dash_new_chat_in')} <span className="font-semibold text-[var(--ap-ink,#111827)]">{projectTitle}</span></p>
        </div>
      )}
      {atLimit && (
        <div className="flex items-center justify-between gap-3 rounded-t-[18px] border-b border-primary/15 bg-primary/[0.07] px-5 py-3">
          <div>
            <p className="text-xs font-semibold text-[var(--ap-accent-ink,#1e40af)]">{tr('plan_limit_title')}</p>
            <p className="mt-0.5 text-xs text-[var(--ap-ink-3,#5b6472)]">{tr('plan_limit_desc')}</p>
          </div>
          <Button variant="primary" size="sm" className="h-8 shrink-0 px-3 text-xs font-semibold" render={<a href="/pay?plan=pro" />}>{tr('plan_limit_upgrade')}</Button>
        </div>
      )}

      <Textarea
        ref={taRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if (!atLimit && e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); void handleSubmit() } }}
        onPaste={handlePaste}
        placeholder={lang === 'id' ? 'Tanyakan sesuatu...' : 'Ask me anything...'}
        aria-label={lang === 'id' ? 'Tanyakan sesuatu' : 'Ask me anything'}
        disabled={atLimit}
        rows={4}
        className="min-h-[116px] px-6 pt-5 pb-3"
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {attachments.map((a, i) => (
            <Badge key={i} className="gap-1.5 rounded-lg px-2.5 py-1 text-[var(--ap-ink-2,#374151)]">
              {a.type.startsWith('image/') ? <img src={a.dataUrl} className="size-4 rounded object-cover" alt="" /> : <FileIcon className="size-3" />}
              <span className="max-w-[100px] truncate">{a.name}</span>
              <Button variant="ghost" size="icon-xs" className="size-4 opacity-40 hover:bg-transparent hover:opacity-100" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} aria-label="Remove attachment"><X className="size-3" /></Button>
            </Badge>
          ))}
        </div>
      )}
      {error && <p className="px-6 pb-2 text-xs text-destructive" role="alert">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
        <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button variant="pill" size="icon-xl" aria-label="Attach file" onClick={() => fileInputRef.current?.click()}><Paperclip className="size-4" /></Button>
        <Button variant="pill" className="h-10 gap-2 px-4" onClick={() => imageInputRef.current?.click()}><ImageIcon className="size-4" /> Attach image</Button>
        <DeliverableTypeSelect value={pendingType} onChange={setPendingType} />
        <Button
          variant="primary"
          size="send"
          data-send
          onClick={() => void handleSubmit()}
          disabled={!canSend}
          aria-label="Send"
          className="ml-auto"
        >
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <ArrowUp className="size-5" />}
        </Button>
      </div>
    </div>
  )
}
