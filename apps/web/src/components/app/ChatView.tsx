'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { marked } from 'marked'
import { ArrowUp, Check, Copy, File as FileIcon, Image as ImageIcon, Paperclip, Pencil, RefreshCw, ThumbsDown, ThumbsUp, UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'
import { copyText } from '../../lib/clipboard'
import { updateLocalConversation } from '../../lib/conversations'
import { updateConversation as updateConversationApi, uploadAttachment, createMessage, getMessages, updateMessage, type Attachment } from '../../api/conversations'
import { apiUrl } from '../../api/base'
import DocumentCard from '../DocumentCard'
import { useLanguage, type StringKey } from '../../lib/i18n'
import { usePipelineStream, type ChatMessage, type Turn } from './usePipelineStream'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export interface AttachedFile { name: string; type: string; dataUrl: string }

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = dataUrl.split(',')
  const mime = meta?.match(/:(.*?);/)?.[1] ?? 'application/octet-stream'
  const bytes = atob(data ?? '')
  const buf = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)
  return new Blob([buf], { type: mime })
}

const STAGE_LABEL_KEYS: Record<string, StringKey> = {
  judge: 'stage_judge',
  implement: 'stage_implement',
  verify: 'stage_verify',
  open_pr: 'stage_open_pr',
}

function timeAgo(iso: string, t: (key: StringKey) => string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return t('dash_time_just_now')
  if (mins < 60) return `${mins} ${t('dash_time_minutes_ago')}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ${t('dash_time_hours_ago')}`
  return `${Math.floor(hours / 24)} ${t('dash_time_days_ago')}`
}

const stripThink = (s: string) => s.replace(/<think>[\s\S]*?<\/think>/g, '')

function IconBtn({ label, onClick, disabled, children, active }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode; active?: boolean }) {
  return (
    <Button variant="ghost" size="icon-sm" title={label} aria-label={label} onClick={onClick} disabled={disabled}
      className={`hover:bg-[rgb(var(--ap-ov,0_0_0)/0.05)] disabled:opacity-30 ${active ? 'text-primary' : 'text-[var(--ap-ink-4,#6b7280)]'}`}>
      {children}
    </Button>
  )
}

function AiMessageActions({ output, conversationId, onRegenerate }: { output: string; conversationId: string; onRegenerate: () => void }) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null)

  const handleCopy = () => {
    void copyText(output).then((ok) => {
      if (!ok) return
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  const sendFeedback = (value: 'like' | 'dislike') => {
    const next = feedback === value ? null : value
    setFeedback(next)
    fetch(apiUrl(`/api/conversations/${conversationId}`), {
      method: 'PATCH', credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ feedback: next }),
    }).catch(() => {})
  }
  return (
    <div className="flex items-center gap-0.5">
      <IconBtn label="Copy" onClick={handleCopy} active={copied}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}</IconBtn>
      <IconBtn label="Like" onClick={() => sendFeedback('like')} active={feedback === 'like'}><ThumbsUp className="size-3.5" /></IconBtn>
      <IconBtn label="Dislike" onClick={() => sendFeedback('dislike')} active={feedback === 'dislike'}><ThumbsDown className="size-3.5" /></IconBtn>
      <IconBtn label="Regenerate" onClick={onRegenerate}><RefreshCw className="size-3.5" /></IconBtn>
    </div>
  )
}

function AttachmentTile({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.mimeType?.startsWith('image/')
  const parts = attachment.filename.split('.')
  const ext = parts.length > 1 ? (parts.pop() ?? '').toUpperCase().slice(0, 4) : 'FILE'
  return (
    <Button variant="outline" render={<a href={attachment.url} target="_blank" rel="noreferrer" />} title={attachment.filename}
      className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-[var(--ap-surface,#fff)] p-0">
      {isImage
        ? <img src={attachment.url} alt={attachment.filename} className="size-full object-cover" />
        : <span className="flex size-full items-center justify-center text-[var(--ap-ink-4,#6b7280)]"><FileIcon className="size-7" /></span>}
      <Badge className="absolute right-1 bottom-1 rounded bg-black/65 px-1 py-0.5 text-[8px] font-bold text-white">{ext}</Badge>
    </Button>
  )
}

function SpectrSign({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-center gap-3">
      <span className="ap-logo ap-logo--mute" aria-hidden="true" />
      {children}
    </div>
  )
}

export default function ChatView({
  initialPrompt,
  conversationId,
  createdAt,
  autoRun,
  onPromptUpdate,
  onOpenDocument,
}: {
  initialPrompt: string
  conversationId: string
  createdAt: string
  autoRun: boolean
  onPromptUpdate: (text: string) => void
  onOpenDocument: (id: string) => void
}) {
  const { t: tr } = useLanguage()
  const [regenNonce, setRegenNonce] = useState(0)
  const regenerateRef = useRef(false)
  const [turns, setTurns] = useState<Turn[]>([{ user: initialPrompt, attachments: [], aiMessages: [] }])
  const [isReloading, setIsReloading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  // sessionStorage survives F5 (not tab close): keeps the last AI output if the DB write hasn't landed yet.
  const lastOutputKey = `spectr_last_output_${conversationId}`

  const reloadTurns = useCallback(() => {
    if (!conversationId) return Promise.resolve()
    return getMessages(conversationId)
      .then((msgs) => {
        if (!msgs.length) return
        const reconstructed: Turn[] = []
        let currentUser = ''
        let currentMessageId: number | undefined
        let currentAttachments: Attachment[] = []
        let currentAi: ChatMessage[] = []
        for (const m of msgs) {
          if (m.role === 'user') {
            if (currentUser) reconstructed.push({ user: currentUser, messageId: currentMessageId, attachments: currentAttachments, aiMessages: currentAi })
            currentUser = m.content
            currentMessageId = m.id
            currentAttachments = m.attachments ?? []
            currentAi = []
          } else if (m.role === 'assistant') {
            const docMeta = m.document
              ? { id: m.document.id, type: m.document.type, title: m.document.title, commitSha: m.document.commitSha ?? null }
              : m.documentId ? { id: m.documentId } : undefined
            currentAi.push({ role: 'ai', isDone: true, output: m.content, document: docMeta })
          }
        }
        if (currentUser) reconstructed.push({ user: currentUser, messageId: currentMessageId, attachments: currentAttachments, aiMessages: currentAi })
        if (reconstructed.length > 0) {
          const last = reconstructed[reconstructed.length - 1]
          if (last && last.aiMessages.length === 0) {
            const cached = sessionStorage.getItem(lastOutputKey)
            if (cached) reconstructed[reconstructed.length - 1] = { ...last, aiMessages: [{ role: 'ai', isDone: true, output: cached }] }
          } else {
            sessionStorage.removeItem(lastOutputKey)
          }
          setTurns(reconstructed)
        }
      })
      .catch(() => {})
  }, [conversationId, lastOutputKey])

  const { messages: liveMessages, streaming } = usePipelineStream(conversationId, regenNonce, autoRun, regenerateRef, (output) => {
    updateLocalConversation(conversationId, { content: output, status: 'done', unread: false })
    sessionStorage.setItem(lastOutputKey, output)
    setTurns((prev) => {
      const last = prev[prev.length - 1]
      if (!last) return prev
      if (last.aiMessages.some((m) => m.isDone && m.output === output)) return prev
      return [
        ...prev.slice(0, -1),
        { ...last, aiMessages: [...last.aiMessages.filter((m) => !m.isDone || m.output), { role: 'ai' as const, isDone: true, output }] },
      ]
    })
    void reloadTurns()
  }, () => {
    setIsReloading(true)
    void reloadTurns()?.finally(() => {
      setIsReloading(false)
      setTurns((prev) => {
        const last = prev[prev.length - 1]
        if (last && last.aiMessages.length === 0) setChatError(tr('pipeline_error'))
        return prev
      })
    })
  })

  const [followUp, setFollowUp] = useState('')
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const [editingTurnIndex, setEditingTurnIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [liveMessages, streaming])
  useEffect(() => { reloadTurns() }, [reloadTurns])

  const handleRefreshResponse = () => {
    if (streaming) return
    regenerateRef.current = true
    setRegenNonce((n) => n + 1)
  }
  const handleStartEdit = (index: number) => { setEditValue(turns[index].user); setEditingTurnIndex(index) }
  const handleSaveEdit = (index: number) => {
    const text = editValue.trim()
    setEditingTurnIndex(null)
    if (!text || text === turns[index].user) return
    const messageId = turns[index].messageId
    if (messageId) updateMessage(conversationId, messageId, text).catch(() => {})
    if (index === 0) {
      onPromptUpdate(text)
      updateConversationApi(conversationId, { title: text, prompt: text }).catch(() => {})
    }
    setTurns((prev) => prev.map((t, i) => (i === index ? { ...t, user: text } : t)))
    regenerateRef.current = true
    setRegenNonce((n) => n + 1)
  }
  const handleCopyPrompt = () => {
    void copyText(initialPrompt).then((ok) => {
      if (!ok) return
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleSend = async () => {
    if (!followUp.trim() || streaming) return
    setChatError(null)
    try {
      const uploaded: Attachment[] = []
      for (const a of attachments) {
        try { uploaded.push(await uploadAttachment(dataUrlToBlob(a.dataUrl), a.name, conversationId)) } catch { /* skip failed upload — keep the message text */ }
      }
      const text = followUp.trim()
      const committedLive = liveMessages.slice()
      const message = await createMessage(conversationId, { content: text, attachmentIds: uploaded.map((a) => a.id) })
      setFollowUp('')
      setAttachments([])
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      setTurns((prev) => {
        const last = prev[prev.length - 1]
        return [
          ...prev.slice(0, -1),
          { ...last, aiMessages: committedLive.length > 0 ? committedLive : last.aiMessages },
          { user: message.content, attachments: message.attachments, aiMessages: [] },
        ]
      })
      regenerateRef.current = false
      setRegenNonce((n) => n + 1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      const text = msg === 'chat quota reached' ? tr('chat_quota_reached') : msg === 'active subscription required' ? tr('dash_expired_error') : tr('dash_generic_error')
      setChatError(text)
      if (msg === 'chat quota reached') toast.warning('Plan limit reached', { description: text })
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="ap-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-8 px-6 pt-6 pb-10">
          {turns.map((turn, ti) => {
            const isLast = ti === turns.length - 1
            const msgs = isLast && liveMessages.length > 0 ? liveMessages : turn.aiMessages
            return (
              <div key={ti} className="flex flex-col gap-8">
                <div className="flex flex-col items-end gap-2">
                  {turn.attachments.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-2">{turn.attachments.map((a) => <AttachmentTile key={a.id} attachment={a} />)}</div>
                  )}
                  <div className={`${editingTurnIndex === ti ? 'w-full' : 'max-w-[78%]'} group flex flex-col items-end gap-1.5`}>
                    {editingTurnIndex === ti ? (
                      <div className="w-full rounded-2xl border bg-[var(--ap-surface,#fff)] px-5 py-3 shadow-sm">
                        <Textarea
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSaveEdit(ti) }
                            if (e.key === 'Escape') setEditingTurnIndex(null)
                          }}
                          rows={Math.max(3, Math.min(10, editValue.split('\n').length + 1))}
                          aria-label="Edit message"
                          className="text-sm leading-relaxed"
                        />
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingTurnIndex(null)} className="text-[var(--ap-ink-3,#5b6472)]">Cancel</Button>
                          <Button size="sm" variant="primary" onClick={() => handleSaveEdit(ti)}>{tr('dash_save_resend')}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-primary px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-white shadow-[0_2px_8px_rgba(38,94,228,0.25)]">{turn.user}</div>
                    )}
                    {editingTurnIndex !== ti && (
                      <div className="flex items-center gap-1 px-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        <span className="mr-1 text-xs text-[var(--ap-ink-4,#6b7280)]">{timeAgo(createdAt, tr)}</span>
                        {isLast && <IconBtn label="Refresh response" onClick={handleRefreshResponse} disabled={streaming}><RefreshCw className="size-3.5" /></IconBtn>}
                        <IconBtn label="Edit" onClick={() => handleStartEdit(ti)}><Pencil className="size-3.5" /></IconBtn>
                        <IconBtn label="Copy" onClick={handleCopyPrompt} active={copied}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}</IconBtn>
                      </div>
                    )}
                  </div>
                </div>

                {msgs.map((m, i) => {
                  if (m.isDone && m.output && m.document) return (
                    <div key={i} className="group relative flex flex-col gap-3">
                      {m.document.type !== 'prototype' ? (
                        <div className="spectr-output ap-prose" dangerouslySetInnerHTML={{ __html: marked.parse(stripThink(m.output).replace(/\[Buka prototype\]\([^)]+\)/g, '').trim()) as string }} />
                      ) : (
                        <p className="ap-prose">Prototype lo udah siap! Klik kartu di bawah untuk buka preview langsung di browser, atau minta revisi kalau ada yang perlu diubah.</p>
                      )}
                      <DocumentCard documentId={m.document.id} initial={m.document as never} onClick={() => onOpenDocument(m.document!.id)} />
                      <SpectrSign>
                        <div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"><AiMessageActions output={m.output} conversationId={conversationId} onRegenerate={handleRefreshResponse} /></div>
                      </SpectrSign>
                    </div>
                  )
                  // Skip stale raw prototype generation outputs saved by older pipeline versions
                  if (m.isDone && m.output && !m.document && /Step\s+1[:\s]|cat\s*>\s*\/app\/prototype|CSSEOF|<< 'EOF'/.test(m.output)) return null
                  if (m.isDone && m.output && !m.document && /<!DOCTYPE html/i.test(m.output)) return (
                    <p key={i} className="text-sm text-[var(--ap-ink-3,#5b6472)]">Prototype berhasil dibuat. Buka panel Documents untuk melihat hasilnya.</p>
                  )
                  if (m.isDone && m.output) return (
                    <div key={i} className="group relative">
                      <div className="spectr-output ap-prose overflow-x-hidden break-words" dangerouslySetInnerHTML={{ __html: marked.parse(stripThink(m.output).trim()) as string }} />
                      <SpectrSign>
                        <div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"><AiMessageActions output={m.output} conversationId={conversationId} onRegenerate={handleRefreshResponse} /></div>
                      </SpectrSign>
                    </div>
                  )
                  if (m.isError) return <p key={i} className="text-sm break-words text-destructive" role="alert">{m.text}</p>
                  return null
                })}

                {isLast && (streaming || isReloading) && !liveMessages.some((m) => m.liveText) && !msgs.some((m) => m.isDone || m.isError) && (() => {
                  const liveMsg = [...msgs].reverse().find((m) => m.liveText)
                  const stageMsg = msgs.filter((m) => m.stage).slice(-1)[0]
                  return (
                    <div className="flex flex-col gap-2" role="status" aria-live="polite">
                      {stageMsg && !liveMsg && (
                        <p className="text-xs text-[var(--ap-ink-3,#5b6472)]">{stageMsg.stage! in STAGE_LABEL_KEYS ? tr(STAGE_LABEL_KEYS[stageMsg.stage!]) : stageMsg.stage}</p>
                      )}
                      {liveMsg ? (
                        <div className="spectr-output ap-prose stream-live overflow-x-hidden break-words"
                          dangerouslySetInnerHTML={{ __html: (marked.parse(stripThink(liveMsg.liveText ?? '').trim()) as string) + '<span class="stream-cursor"></span>' }} />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {[0, 150, 300].map((d) => <span key={d} className="size-2 animate-bounce rounded-full bg-black/25" style={{ animationDelay: `${d}ms` }} />)}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 px-6 pb-6">
        <div
          className={`ap-glass mx-auto max-w-[770px] transition-shadow ${isDragging ? 'ring-2 ring-primary' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && <div className="flex items-center justify-center gap-2 px-5 pt-4 pb-1 text-sm text-primary"><UploadCloud className="size-4" /> Drop to attach</div>}
          {chatError && <p className="px-5 pt-3 text-xs text-destructive" role="alert">{chatError}</p>}
          <Textarea
            ref={textareaRef}
            value={followUp}
            onChange={(e) => {
              setFollowUp(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px'
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); void handleSend() } }}
            onPaste={handlePaste}
            placeholder="Write a message..."
            aria-label="Write a message"
            rows={2}
            disabled={streaming}
            className="max-h-[180px] min-h-[64px] px-5 pt-4 pb-1 text-[15px]"
          />
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {attachments.map((a, i) => (
                <Badge key={i} className="gap-1.5 rounded-lg px-2.5 py-1 text-[var(--ap-ink-2,#374151)]">
                  {a.type.startsWith('image/') ? <img src={a.dataUrl} className="size-4 rounded object-cover" alt="" /> : <FileIcon className="size-3" />}
                  <span className="max-w-[100px] truncate">{a.name}</span>
                  <Button variant="ghost" size="icon-xs" className="size-4 opacity-40 hover:bg-transparent hover:opacity-100" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} aria-label="Remove attachment"><X className="size-3" /></Button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 px-3.5 pt-1 pb-3.5">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
            <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            <Button variant="pill" size="icon-xl" aria-label="Attach file" onClick={() => fileInputRef.current?.click()}><Paperclip className="size-4" /></Button>
            <Button variant="pill" className="h-10 gap-2 px-4" onClick={() => imageInputRef.current?.click()}><ImageIcon className="size-4" /> Attach image</Button>
            <span className="ml-1 hidden text-xs text-[var(--ap-ink-4,#6b7280)] sm:block">↵ send</span>
            <Button
              variant="primary"
              size="send"
              data-send
              onClick={() => void handleSend()}
              disabled={streaming || !followUp.trim()}
              aria-label="Send message"
              className="ml-auto"
            >
              <ArrowUp className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
