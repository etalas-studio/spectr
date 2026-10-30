'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, FolderPlus, MessageCircle, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { LocalConversation } from '../../lib/conversations'

interface Item { id: string; label: string; hint?: string; icon: typeof Search; run: () => void }

export function SearchDialog({
  open,
  onOpenChange,
  conversations,
  onOpenConversation,
  onNewProject,
  onArtifacts,
  onSettings,
  placeholder,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  conversations: LocalConversation[]
  onOpenConversation: (c: LocalConversation) => void
  onNewProject: () => void
  onArtifacts: () => void
  onSettings: () => void
  placeholder: string
}) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => { if (!open) { setQ(''); setActive(0) } }, [open])

  const items = useMemo<Item[]>(() => {
    const go = (fn: () => void) => () => { onOpenChange(false); fn() }
    const actions: Item[] = [
      { id: 'a-new', label: 'New project', icon: FolderPlus, run: go(onNewProject) },
      { id: 'a-art', label: 'Artifacts', icon: FileText, run: go(onArtifacts) },
      { id: 'a-set', label: 'Settings', icon: Settings, run: go(onSettings) },
    ]
    const chats: Item[] = conversations.map((c) => ({
      id: c.id, label: c.summary, hint: new Date(c.createdAt).toLocaleDateString(), icon: MessageCircle, run: go(() => onOpenConversation(c)),
    }))
    const needle = q.trim().toLowerCase()
    const all = [...actions, ...chats]
    return (needle ? all.filter((i) => i.label.toLowerCase().includes(needle)) : all).slice(0, 12)
  }, [q, conversations, onOpenChange, onOpenConversation, onNewProject, onArtifacts, onSettings])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="top-[22%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-2.5 border-b px-4">
          <Search className="size-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
              if (e.key === 'Enter') { e.preventDefault(); items[active]?.run() }
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 text-sm shadow-none focus-visible:bg-transparent focus-visible:ring-0"
          />
          <Kbd>esc</Kbd>
        </div>
        <ul className="max-h-[320px] overflow-y-auto p-1.5" role="listbox">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No results</li>}
          {items.map((it, i) => (
            <li key={it.id} role="option" aria-selected={i === active}>
              <Button
                variant="ghost"
                onMouseEnter={() => setActive(i)}
                onClick={it.run}
                className={`h-auto w-full justify-start gap-3 px-3 py-2.5 font-normal ${i === active ? 'bg-black/5' : ''}`}
              >
                <it.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-left">{it.label}</span>
                {it.hint && <span className="text-xs text-muted-foreground">{it.hint}</span>}
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
