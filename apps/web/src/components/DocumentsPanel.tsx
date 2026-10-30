'use client'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LayoutGrid, LayoutTemplate, CalendarDays, Check, ChevronDown, Download, Eye, FileText, ListFilter, Loader2, Search, X } from 'lucide-react'
import { apiUrl } from '../api/base'
import { documentExportUrl } from '../api/documents'
import { typeMeta, DOWNLOAD_FORMATS } from './app/meta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectIcon, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDownIcon } from 'lucide-react'

export interface DocumentItem {
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

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

function DownloadMenu({ docId }: { docId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-[12px] border bg-[var(--ap-surface,#fff)] px-3.5 text-[13px] font-medium text-[var(--ap-ink-2,#374151)] transition-colors hover:bg-[rgb(var(--ap-ov,0_0_0)/0.04)]">
        <Download className="size-3.5" /> Download <ChevronDown className="size-3 text-[var(--ap-ink-4,#6b7280)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-44">
        {DOWNLOAD_FORMATS.map((f) => (
          <DropdownMenuItem key={f.ext} render={<a href={documentExportUrl(docId, f.ext)} download />}>{f.label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ArtifactCard({ doc, onOpenConversation, onOpen, onChanged }: {
  doc: DocumentItem
  onOpenConversation: (conversationId: string | null, docTitle: string) => void
  onOpen: (doc: DocumentItem) => void
  onChanged: () => void
}) {
  const meta = typeMeta(doc.type)
  const Icon = meta.icon
  const isPrototype = doc.type === 'prototype'
  const latest = doc.latestVersionNo ?? 1
  const current = doc.currentVersionNo ?? latest
  const [version, setVersion] = useState(current)
  const [setting, setSetting] = useState(false)
  const base = (doc.previewUrl ?? apiUrl(`/p/${doc.id}`)).replace(/\/$/, '')
  const protoUrl = `${base}/v/${version}/`

  const setCurrent = async () => {
    setSetting(true)
    try {
      const res = await fetch(apiUrl(`/api/documents/${doc.id}/rollback`), {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ versionNo: version }),
      })
      if (!res.ok) throw new Error()
      toast.success('Version set as current', { description: `${doc.title} is now on v${version}.` })
      onChanged()
    } catch {
      toast.error("Couldn't set version")
    } finally { setSetting(false) }
  }

  return (
    <article
      className="ap-art flex cursor-pointer flex-col"
      onClick={() => onOpenConversation(doc.conversationId, doc.title)}
    >
      <div className="relative h-40 shrink-0 overflow-hidden">
        {isPrototype && doc.latestVersionNo ? (
          <iframe
            src={protoUrl}
            title="preview"
            className="pointer-events-none absolute top-0 left-0 h-[640px] w-[400%] origin-top-left scale-25 border-0"
            tabIndex={-1}
            aria-hidden="true"
          />
        ) : (
          <div className="flex size-full items-center justify-center" style={{ background: meta.wash }}>
            <Icon className="size-10 opacity-40" strokeWidth={1.5} style={{ color: meta.ink }} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: meta.ink }}>
            <span className="flex size-5 items-center justify-center rounded" style={{ backgroundColor: meta.tint }}><Icon className="size-[11px]" /></span>
            {meta.label}
          </span>
          {doc.latestVersionNo != null && <span className="rounded-full bg-[rgb(var(--ap-ov,0_0_0)/0.05)] px-2 py-0.5 text-[10px] font-medium text-[var(--ap-ink-4,#6b7280)]">v{doc.latestVersionNo}</span>}
        </div>
        <div>
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold">{doc.title}</h3>
          <p className="mt-0.5 text-xs text-[var(--ap-ink-4,#6b7280)]">{fmtDate(doc.createdAt ?? doc.updatedAt)}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="primary" className="h-9 gap-1.5 px-3.5 text-[13px] font-semibold" onClick={() => onOpen(doc)}>
            <Eye className="size-3.5" /> {isPrototype ? 'Preview' : 'Open'}
          </Button>
          {isPrototype ? (
            <>
              <Select value={String(version)} onValueChange={(v) => setVersion(Number(v))}>
                <SelectTrigger className="h-9 rounded-[12px] border bg-[var(--ap-surface,#fff)] px-3 text-[13px] font-medium text-[var(--ap-ink-2,#374151)]" aria-label="Version">
                  <SelectValue>{(v) => `v${v}${Number(v) === current ? ' ✓' : ''}`}</SelectValue>
                  <SelectIcon><ChevronDownIcon className="size-3" /></SelectIcon>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: latest }, (_, i) => latest - i).map((v) => (
                    <SelectItem key={v} value={String(v)}>v{v}{v === current ? ' (current)' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {version !== current && (
                <Button variant="outline" disabled={setting} onClick={() => void setCurrent()} className="h-9 rounded-[12px] px-3.5 text-[13px] font-medium">
                  {setting ? 'Setting…' : 'Set current'}
                </Button>
              )}
            </>
          ) : (
            <DownloadMenu docId={doc.id} />
          )}
        </div>
      </div>
    </article>
  )
}

const TABS = [{ id: 'all', label: 'All', icon: LayoutGrid }, { id: 'documents', label: 'Documents', icon: FileText }, { id: 'prototypes', label: 'Prototypes', icon: LayoutTemplate }] as const
type Tab = typeof TABS[number]['id']
type Sort = 'newest' | 'oldest' | 'name'
const SORTS: { id: Sort; label: string }[] = [{ id: 'newest', label: 'Newest first' }, { id: 'oldest', label: 'Oldest first' }, { id: 'name', label: 'Name A–Z' }]

export default function DocumentsPanel({ onOpenDocument, onOpenConversation }: {
  onOpenDocument: (id: string, conversationId: string | null) => void
  onOpenConversation?: (conversationId: string | null, docTitle: string) => void
}) {
  const [items, setItems] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<Sort>('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(() => {
    fetch(apiUrl('/api/documents'), { credentials: 'include' })
      .then((r) => r.json())
      .then((list: DocumentItem[]) => { setItems(list); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const sorted = items.slice().sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title)
    const d = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    return sortBy === 'oldest' ? -d : d
  })
  const filtered = sorted.filter((d) => {
    const okTab = tab === 'all' ? true : tab === 'prototypes' ? d.type === 'prototype' : d.type !== 'prototype'
    const okSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase())
    const ts = new Date(d.updatedAt).getTime()
    return okTab && okSearch && (!dateFrom || ts >= new Date(dateFrom).getTime()) && (!dateTo || ts <= new Date(dateTo + 'T23:59:59').getTime())
  })
  const counts: Record<Tab, number> = {
    all: sorted.length,
    documents: sorted.filter((d) => d.type !== 'prototype').length,
    prototypes: sorted.filter((d) => d.type === 'prototype').length,
  }
  const openConversation = (id: string | null, title: string) => { onOpenConversation?.(id, title) }
  const dateActive = !!(dateFrom || dateTo)
  const range: DateRange | undefined = dateFrom ? { from: parseISO(dateFrom), to: dateTo ? parseISO(dateTo) : undefined } : undefined

  return (
    <div className="ap-scroll min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-8">
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mr-auto gap-0">
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  <t.icon /> {t.label}
                  {counts[t.id] > 0 && <span className="text-xs text-[var(--ap-ink-4,#6b7280)]">{counts[t.id]}</span>}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--ap-ink-4,#6b7280)]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" aria-label="Search artifacts" className="h-10 w-48 rounded-[12px] border-[var(--ap-edge,rgba(255,255,255,.95))] bg-[var(--ap-surface,#fff)] pl-8 text-[13px] shadow-[0_1px_2px_rgba(17,24,39,0.06)]" />
            {search && <Button type="button" variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setSearch('')} className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--ap-ink-4,#6b7280)] hover:text-[var(--ap-ink-2,#374151)]"><X className="size-3.5" /></Button>}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className={`inline-flex h-10 items-center gap-2 rounded-[12px] border px-3.5 text-[13px] font-medium shadow-[0_1px_2px_rgba(17,24,39,0.06)] transition-colors ${sortBy !== 'newest' ? 'border-primary bg-primary text-white' : 'border-[var(--ap-edge,rgba(255,255,255,.95))] bg-[var(--ap-surface,#fff)] text-[var(--ap-ink-2,#374151)] hover:bg-[var(--ap-surface,#fff)]'}`}>
              <ListFilter className="size-3.5" /> Filter
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Sort</DropdownMenuLabel>
                {SORTS.map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => setSortBy(s.id)} className={sortBy === s.id ? 'font-semibold text-primary' : ''}>
                    {s.label} {sortBy === s.id && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {sortBy !== 'newest' && (<><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setSortBy('newest')}>Reset</DropdownMenuItem></>)}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger className={`inline-flex h-10 items-center gap-2 rounded-[12px] border px-3.5 text-[13px] font-medium shadow-[0_1px_2px_rgba(17,24,39,0.06)] transition-colors ${dateActive ? 'border-primary bg-primary text-white' : 'border-[var(--ap-edge,rgba(255,255,255,.95))] bg-[var(--ap-surface,#fff)] text-[var(--ap-ink-2,#374151)] hover:bg-[var(--ap-surface,#fff)]'}`}>
              <CalendarDays className="size-3.5" />
              {range?.from ? `${format(range.from, 'MMM d')}${range.to ? ` - ${format(range.to, 'MMM d')}` : ''}` : 'Date'}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto gap-0 p-0">
              <Calendar
                mode="range"
                numberOfMonths={1}
                defaultMonth={range?.from}
                selected={range}
                onSelect={(r) => { setDateFrom(r?.from ? format(r.from, 'yyyy-MM-dd') : ''); setDateTo(r?.to ? format(r.to, 'yyyy-MM-dd') : '') }}
              />
              {dateActive && (
                <div className="border-t p-2">
                  <Button variant="destructive" size="sm" className="h-9 w-full gap-2 rounded-[12px]" onClick={() => { setDateFrom(''); setDateTo('') }}><X /> Reset</Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--ap-ink-4,#6b7280)]"><Loader2 className="size-4 animate-spin" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto mt-4 flex min-h-[420px] max-w-full flex-col items-center justify-center rounded-2xl bg-[var(--ap-surface,#fff)] text-center shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[rgb(var(--ap-ov,0_0_0)/0.05)] text-[var(--ap-ink-4,#6b7280)]"><FileText className="size-[22px]" /></span>
            <p className="mt-4 text-sm font-medium">{search ? 'No results found' : 'No artifacts yet'}</p>
            <p className="mt-1 text-xs text-[var(--ap-ink-3,#5b6472)]">{search ? `No artifacts match "${search}"` : 'Start a chat and ask Spectr to generate a document or prototype.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((d) => (
              <ArtifactCard key={d.id} doc={d} onOpenConversation={openConversation} onOpen={(doc) => onOpenDocument(doc.id, doc.conversationId)} onChanged={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
