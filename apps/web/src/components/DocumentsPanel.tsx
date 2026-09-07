'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Select } from '@base-ui/react'
import { apiUrl } from '../api/base'

interface DocumentItem {
  id: string
  type: string
  title: string
  currentVersionId: string | null
  latestVersionNo: number | null
  currentVersionNo: number | null
  previewUrl: string | null
  conversationId: string | null
  createdAt?: string
  updatedAt: string
}

const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  prd:       { label: 'PRD',       icon: 'solar:document-text-bold',  color: '#3b82f6', bg: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)' },
  quotation: { label: 'Quotation', icon: 'solar:bill-list-bold',      color: '#8b5cf6', bg: 'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)' },
  prototype: { label: 'Prototype', icon: 'solar:widget-bold',         color: '#0d9488', bg: 'linear-gradient(135deg,#f0fdfa 0%,#ccfbf1 100%)' },
  specs:     { label: 'Specs',     icon: 'solar:clipboard-list-bold', color: '#f97316', bg: 'linear-gradient(135deg,#fff7ed 0%,#fed7aa 100%)' },
}

const DOWNLOAD_FORMATS = [
  { ext: 'pdf',  label: 'PDF',        icon: 'solar:file-pdf-linear' },
  { ext: 'doc',  label: 'Word (.doc)', icon: 'solar:file-text-linear' },
  { ext: 'md',   label: 'Markdown',   icon: 'solar:document-linear' },
  { ext: 'html', label: 'HTML',       icon: 'solar:code-file-linear' },
  { ext: 'csv',  label: 'CSV',        icon: 'solar:table-linear' },
]

const selectStyles = {
  trigger: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 20,
    border: '1px solid rgba(0,0,0,0.12)',
    backgroundColor: '#ffffff', color: '#374151',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    outline: 'none', whiteSpace: 'nowrap',
  } as React.CSSProperties,
  popup: {
    backgroundColor: '#ffffff', borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    padding: '4px', minWidth: 130, zIndex: 50,
  } as React.CSSProperties,
}

function DownloadDropdown({ docId }: { docId: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
        style={{ borderColor: 'rgba(0,0,0,0.12)', color: '#374151', backgroundColor: '#ffffff' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
      >
        <iconify-icon icon="solar:download-linear" width="12" />
        Download
      </button>
      {open && (
        <div
          className="absolute left-0 bottom-full mb-1.5 z-50 rounded-2xl py-2"
          style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160 }}
        >
          {DOWNLOAD_FORMATS.map(f => (
            <a
              key={f.ext}
              href={apiUrl(`/api/documents/${docId}/export?format=${f.ext}`)}
              download
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors"
              style={{ color: '#374151', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
            >
              <iconify-icon icon={f.icon} width="13" style={{ color: 'rgba(0,0,0,0.4)' }} />
              {f.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function PreviewPanel({ doc, onClose, onOpenConversation }: {
  doc: DocumentItem
  onClose: () => void
  onOpenConversation: (conversationId: string | null, docTitle: string) => void
}) {
  const meta = TYPE_META[doc.type] ?? TYPE_META.prd
  const dateStr = new Date(doc.createdAt ?? doc.updatedAt).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const isPrototype = doc.type === 'prototype'
  const previewUrl = doc.previewUrl ?? (isPrototype ? apiUrl(`/p/${doc.id}/v/${doc.currentVersionNo ?? 1}/`) : null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{ width: 'min(600px, 90vw)', backgroundColor: '#ffffff', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}18` }}>
            <iconify-icon icon={meta.icon} width="16" style={{ color: meta.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{doc.title}</p>
            <p className="text-xs" style={{ color: '#9ca3af' }}>{meta.label} · {dateStr}{doc.latestVersionNo ? ` · v${doc.latestVersionNo}` : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: 'rgba(0,0,0,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
          >
            <iconify-icon icon="solar:close-linear" width="16" />
          </button>
        </div>

        {/* Preview body */}
        <div className="flex-1 overflow-hidden relative">
          {isPrototype && previewUrl ? (
            <iframe src={previewUrl} className="w-full h-full border-none" title={doc.title} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8" style={{ background: meta.bg }}>
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: `${meta.color}20` }}>
                <iconify-icon icon={meta.icon} width="36" style={{ color: meta.color }} />
              </div>
              <p className="text-sm text-center" style={{ color: 'rgba(0,0,0,0.4)', maxWidth: 240 }}>
                Document preview not available — open the chat to view the full content.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <button
            onClick={() => { onOpenConversation(doc.conversationId, doc.title); onClose() }}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#111827' }}
          >
            <iconify-icon icon="solar:chat-round-linear" width="14" />
            Go to chat
          </button>
          {!isPrototype && (
            <div onClick={e => e.stopPropagation()}>
              <DownloadDropdown docId={doc.id} />
            </div>
          )}
          {isPrototype && previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-colors"
              style={{ borderColor: 'rgba(0,0,0,0.12)', color: '#374151', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
            >
              <iconify-icon icon="solar:square-top-up-linear" width="14" />
              Open in new tab
            </a>
          )}
        </div>
      </div>
    </>
  )
}

function ArtifactCard({ doc, onOpenConversation, onOpenPreview, onChanged }: {
  doc: DocumentItem
  onOpenConversation: (conversationId: string | null, docTitle: string) => void
  onOpenPreview: (doc: DocumentItem) => void
  onChanged: () => void
}) {
  const meta = TYPE_META[doc.type] ?? { label: doc.type, icon: 'solar:document-linear', color: '#6b7280', bg: '#f9fafb' }
  const isPrototype = doc.type === 'prototype'
  const latest = doc.latestVersionNo ?? 1
  const current = doc.currentVersionNo ?? latest
  const [version, setVersion] = useState(current)
  const [setting, setSetting] = useState(false)
  const dateStr = new Date(doc.createdAt ?? doc.updatedAt).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const base = (doc.previewUrl ?? apiUrl(`/p/${doc.id}`)).replace(/\/$/, '')
  const protoUrl = `${base}/v/${version}/`

  const setCurrent = async () => {
    setSetting(true)
    try {
      await fetch(apiUrl(`/api/documents/${doc.id}/rollback`), {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ versionNo: version }),
      })
      onChanged()
    } finally { setSetting(false) }
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col cursor-pointer transition-shadow hover:shadow-md"
      style={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}
      onClick={() => onOpenConversation(doc.conversationId, doc.title)}
    >
      {/* Preview area */}
      <div style={{ height: 160, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
        {isPrototype && doc.latestVersionNo ? (
          <iframe
            src={protoUrl}
            title="preview"
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '400%', height: '640px',
              transform: 'scale(0.25)', transformOrigin: 'top left',
              border: 'none', pointerEvents: 'none',
            }}
            tabIndex={-1}
            aria-hidden="true"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: meta.bg }}>
            <iconify-icon icon={meta.icon} width="40" style={{ color: `${meta.color}60` }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Badge row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: `${meta.color}18` }}>
              <iconify-icon icon={meta.icon} width="11" style={{ color: meta.color }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
          </div>
          {doc.latestVersionNo != null && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: '#9ca3af' }}>
              v{doc.latestVersionNo}
            </span>
          )}
        </div>

        {/* Title + date */}
        <div>
          <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: '#111827' }}>{doc.title}</p>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{dateStr}</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 mt-auto" onClick={e => e.stopPropagation()}>
          {isPrototype ? (
            <>
              {/* Preview button */}
              <a
                href={protoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                style={{ backgroundColor: '#111827', color: '#ffffff', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#374151')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#111827')}
              >
                <iconify-icon icon="solar:eye-bold" width="12" />
                Preview
              </a>

              {/* Version selector */}
              <Select.Root value={String(version)} onValueChange={(v) => setVersion(Number(v))}>
                <Select.Trigger style={{ ...selectStyles.trigger }}>
                  <Select.Value>{`v${version}${version === current ? ' ✓' : ''}`}</Select.Value>
                  <iconify-icon icon="solar:alt-arrow-down-linear" width="11" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner sideOffset={4}>
                    <Select.Popup style={selectStyles.popup}>
                      {Array.from({ length: latest }, (_, i) => latest - i).map((v) => (
                        <Select.Item
                          key={v}
                          value={String(v)}
                          style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: '#111827' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.04)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                        >
                          <Select.ItemText>v{v}{v === current ? ' (current)' : ''}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>

              {version !== current && (
                <button
                  onClick={() => void setCurrent()}
                  disabled={setting}
                  className="text-xs px-3 py-1.5 rounded-full border transition-opacity"
                  style={{ borderColor: 'rgba(0,0,0,0.12)', color: '#374151', opacity: setting ? 0.5 : 1 }}
                >
                  {setting ? 'Setting…' : 'Set current'}
                </button>
              )}
            </>
          ) : (
            <>
              {/* Open → slide panel */}
              <button
                onClick={() => onOpenPreview(doc)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                style={{ backgroundColor: '#111827', color: '#ffffff' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#374151')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#111827')}
              >
                <iconify-icon icon="solar:eye-bold" width="12" />
                Open
              </button>

              <DownloadDropdown docId={doc.id} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const TABS = ['All', 'Documents', 'Prototypes'] as const
type Tab = typeof TABS[number]

export default function DocumentsPanel({ onOpenDocument, onOpenConversation }: {
  onOpenDocument: (id: string) => void
  onOpenConversation?: (conversationId: string | null, docTitle: string) => void
}) {
  const [items, setItems] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null)

  const load = useCallback(() => {
    fetch(apiUrl('/api/documents'), { credentials: 'include' })
      .then((r) => r.json())
      .then((list: DocumentItem[]) => { setItems(list); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const sorted = items.slice().sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title)
    if (sortBy === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const filtered = sorted.filter(d => {
    const matchesTab = tab === 'All' ? true : tab === 'Prototypes' ? d.type === 'prototype' : d.type !== 'prototype'
    const matchesSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase())
    const ts = new Date(d.updatedAt).getTime()
    const matchesFrom = !dateFrom || ts >= new Date(dateFrom).getTime()
    const matchesTo = !dateTo || ts <= new Date(dateTo + 'T23:59:59').getTime()
    return matchesTab && matchesSearch && matchesFrom && matchesTo
  })

  const counts = {
    All: sorted.length,
    Documents: sorted.filter(d => d.type !== 'prototype').length,
    Prototypes: sorted.filter(d => d.type === 'prototype').length,
  }

  const handleOpenConversation = (conversationId: string | null, docTitle: string) => {
    if (onOpenConversation) onOpenConversation(conversationId, docTitle)
    else onOpenDocument(conversationId ?? '')
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: '#111827', fontFamily: "'Instrument Serif', serif" }}>
            Artifacts
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
            All documents and prototypes generated by Spectr
          </p>
        </div>

        {/* Tabs + Filter + Search */}
        <div className="flex items-center gap-2 mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl mr-auto" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={tab === t
                  ? { backgroundColor: '#ffffff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#6b7280' }
                }
              >
                {t}
                {counts[t] > 0 && (
                  <span className="ml-1.5 text-xs" style={{ color: tab === t ? '#9ca3af' : 'rgba(0,0,0,0.3)' }}>
                    {counts[t]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => { setFilterOpen(v => !v); setDateOpen(false) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors"
              style={{
                backgroundColor: sortBy !== 'newest' ? '#3b82f6' : '#ffffff',
                borderColor: sortBy !== 'newest' ? '#3b82f6' : 'rgba(0,0,0,0.1)',
                color: sortBy !== 'newest' ? '#ffffff' : '#374151',
              }}
            >
              <iconify-icon icon="solar:tuning-2-linear" width="13" />
              Filter
            </button>

            {filterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1.5 z-50 rounded-2xl p-4 flex flex-col gap-2"
                  style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: 190 }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#9ca3af' }}>Sort</p>
                  {(['newest', 'oldest', 'name'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors"
                      style={{ backgroundColor: sortBy === s ? '#eff6ff' : 'transparent', color: sortBy === s ? '#3b82f6' : '#374151', fontWeight: sortBy === s ? 600 : 400 }}
                    >
                      <iconify-icon icon={s === 'newest' ? 'solar:sort-from-bottom-to-top-linear' : s === 'oldest' ? 'solar:sort-from-top-to-bottom-linear' : 'solar:sort-linear'} width="13" />
                      {s === 'newest' ? 'Newest first' : s === 'oldest' ? 'Oldest first' : 'Name A–Z'}
                    </button>
                  ))}
                  {sortBy !== 'newest' && (
                    <button onClick={() => setSortBy('newest')} className="text-xs text-center py-1.5 rounded-lg mt-1" style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}>
                      Reset
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Date range dropdown */}
          <div className="relative">
            <button
              onClick={() => { setDateOpen(v => !v); setFilterOpen(false) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors"
              style={{
                backgroundColor: (dateFrom || dateTo) ? '#3b82f6' : '#ffffff',
                borderColor: (dateFrom || dateTo) ? '#3b82f6' : 'rgba(0,0,0,0.1)',
                color: (dateFrom || dateTo) ? '#ffffff' : '#374151',
              }}
            >
              <iconify-icon icon="solar:calendar-linear" width="13" />
              Date
            </button>

            {dateOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDateOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1.5 z-50 rounded-2xl p-4 flex flex-col gap-3"
                  style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: 220 }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Date range</p>
                  {([
                    { label: 'From', value: dateFrom, set: setDateFrom },
                    { label: 'To',   value: dateTo,   set: setDateTo },
                  ] as const).map(({ label, value, set }) => (
                    <div key={label}>
                      <p className="text-[10px] mb-1.5" style={{ color: '#9ca3af' }}>{label}</p>
                      <input
                        type="date"
                        value={value}
                        onChange={e => set(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                        style={{ borderColor: value ? '#3b82f6' : 'rgba(0,0,0,0.1)', color: value ? '#3b82f6' : '#374151', colorScheme: 'light' }}
                      />
                    </div>
                  ))}
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-center py-1.5 rounded-lg" style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}>
                      Reset
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.1)', width: 200 }}>
            <iconify-icon icon="solar:magnifer-linear" width="13" style={{ color: 'rgba(0,0,0,0.3)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent outline-none text-xs min-w-0"
              style={{ color: '#111827' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: 'rgba(0,0,0,0.3)', lineHeight: 1, flexShrink: 0 }}>
                <iconify-icon icon="solar:close-circle-bold" width="13" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
            <iconify-icon icon="solar:refresh-linear" width="16" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
              <iconify-icon icon="solar:documents-linear" width="22" style={{ color: 'rgba(0,0,0,0.2)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#374151' }}>{search ? 'No results found' : 'No artifacts yet'}</p>
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>{search ? `No artifacts match "${search}"` : 'Start a chat and ask Spectr to generate a document or prototype.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(d => (
              <ArtifactCard
                key={d.id}
                doc={d}
                onOpenConversation={handleOpenConversation}
                onOpenPreview={setPreviewDoc}
                onChanged={load}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slide preview panel */}
      {previewDoc && (
        <PreviewPanel
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onOpenConversation={handleOpenConversation}
        />
      )}
    </div>
  )
}
