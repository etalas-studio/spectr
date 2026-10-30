import { useState, useEffect } from 'react'
import { apiUrl } from '../../api/base'
import { generateConversation, type Attachment } from '../../api/conversations'
import { useLanguage } from '../../lib/i18n'

export interface ChatMessage {
  role: 'user' | 'ai'
  text?: string
  stage?: string        // for stage_start events
  isDone?: boolean
  isError?: boolean
  output?: string
  liveText?: string     // accumulated streaming chunks (not yet committed)
  conversationId?: string
  document?: { id: string; type?: string; title?: string; versionNo?: number; previewUrl?: string | null }
}

export interface Turn {
  user: string
  messageId?: number
  attachments: Attachment[]
  aiMessages: ChatMessage[]
}

export function usePipelineStream(conversationId: string | null, regenNonce: number, autoRun: boolean, regenerateRef: { current: boolean }, onDone?: (output: string) => void, onSettled?: () => void) {
  const { t: tr } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)

  useEffect(() => {
    if (!conversationId) return
    // Don't auto-generate when opening existing conversation from history (regenNonce=0 and autoRun=false)
    if (!autoRun && regenNonce === 0) return
    setMessages([])
    setStreaming(true)

    const ctrl = new AbortController()
    let disposed = false

    // Trigger generate FIRST so inFlight is set before stream connects.
    // Stream checks inFlight on connect — if empty it closes immediately.
    generateConversation(conversationId, { regenerate: regenerateRef.current }).catch(() => {})

    const parseEvent = (line: string): { type: string; stage?: string; text?: string; document?: { id: string; type?: string; title?: string; versionNo?: number; previewUrl?: string | null }; conversation?: { output?: string | null } } | null => {
      try {
        const ev = JSON.parse(line.replace(/^data: /, '').trim()) as { type: string; stage?: string; text?: string; document?: { id: string; type?: string; title?: string; versionNo?: number; previewUrl?: string | null }; conversation?: { output?: string | null } }
        return ev.type ? ev : null
      } catch {
        return null
      }
    }

    const handleEvent = (ev: { type: string; stage?: string; text?: string; document?: { id: string; type?: string; title?: string; versionNo?: number; previewUrl?: string | null }; conversation?: { output?: string | null } }): 'continue' | 'done' => {
      if (ev.type === 'stage_start' && ev.stage) {
        setMessages(m => [...m, { role: 'ai', stage: ev.stage }])
        return 'continue'
      }
      if (ev.type === 'output_chunk' && ev.text) {
        setMessages(m => {
          const last = m[m.length - 1]
          if (last && last.role === 'ai' && !last.isDone && !last.isError) {
            return [...m.slice(0, -1), { ...last, liveText: (last.liveText ?? '') + ev.text }]
          }
          return [...m, { role: 'ai', liveText: ev.text }]
        })
        return 'continue'
      }
      if (ev.type === 'done') {
        const output = ev.text ?? ''
        if (output) {
          // Replace any in-progress live bubble with the final committed bubble.
          setMessages(m => {
            const withoutLive = m.filter(msg => msg.isDone || msg.isError || msg.role === 'user')
            return [...withoutLive, { role: 'ai', isDone: true, output, document: ev.document }]
          })
          setStreaming(false)
          onDone?.(output)
        } else {
          // "done" without text: the stream reconnected after generation
          // finished (or this is the connect-time "already done" probe). Don't
          // append an empty bubble — reload from DB so the result renders.
          setStreaming(false)
          onSettled?.()
        }
        return 'done'
      }
      if (ev.type === 'error') {
        const raw = ev.text ?? ''
        const errText = raw === 'prototype quota reached'
          ? tr('prototype_quota_reached')
          : raw === 'monthly quota reached'
            ? tr('plan_limit_desc')
            : raw || tr('pipeline_error')
        setMessages(m => [...m, { role: 'ai', isError: true, text: errText }])
        setStreaming(false)
        return 'done'
      }
      return 'continue'
    }

    // Reconnect with exponential backoff when the stream drops without a
    // terminal event. Prototype generation can take 10+ minutes; proxies kill
    // idle SSE connections long before that, so a single fetch is not enough.
    const connect = (attempt: number) => {
      if (disposed) return
      fetch(apiUrl(`/api/conversations/${conversationId}/stream`), { credentials: 'include', signal: ctrl.signal })
        .then(async res => {
          const reader = res.body!.getReader()
          const dec = new TextDecoder()
          let buf = ''
          try {
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              buf += dec.decode(value, { stream: true })
              const parts = buf.split('\n\n')
              buf = parts.pop() ?? ''
              for (const part of parts) {
                const line = part.replace(/^data: /, '').trim()
                if (!line || line.startsWith(':')) continue // skip heartbeats/comments
                const ev = parseEvent(line)
                if (!ev) continue
                if (handleEvent(ev) === 'done') return
              }
            }
            // Stream ended without a terminal event → reconnect with backoff.
            if (!disposed) {
              const delay = Math.min(8000, 500 * 2 ** attempt)
              setTimeout(() => connect(attempt + 1), delay)
            }
          } catch {
            // fetch/read error (network, proxy reset) → reconnect with backoff.
            if (!disposed) {
              const delay = Math.min(8000, 500 * 2 ** attempt)
              setTimeout(() => connect(attempt + 1), delay)
            }
          }
        })
        .catch(() => {
          if (!disposed) {
            const delay = Math.min(8000, 500 * 2 ** attempt)
            setTimeout(() => connect(attempt + 1), delay)
          }
        })
    }

    // Small delay so inFlight is registered before stream connects.
    const firstConnect = setTimeout(() => connect(0), 100)

    return () => {
      disposed = true
      clearTimeout(firstConnect)
      ctrl.abort()
    }
  }, [conversationId, regenNonce])

  return { messages, streaming }
}
