'use client'

import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight, FileText, FolderClosed, FolderOpen, FolderPlus, MessageCircle, MoreHorizontal, Pencil, PanelLeft, PinIcon, PlusCircle, Search, Share2, Trash2, Zap, EyeOff } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { FOLDER_COLORS } from './meta'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { SegmentedProgress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { ConversationGroup, LocalConversation } from '../../lib/conversations'

export interface ChecklistItem { key: string; label: string; done: boolean }

export interface SidebarProps {
  activeNav: 'home' | 'documents'
  chatActive: boolean
  onNewProject: () => void
  onArtifacts: () => void
  onSearch: () => void
  onCollapse: () => void
  labels: { menu: string; newProject: string; artifacts: string; projects: string; noChats: string; newChatInProject: string; renameProject: string; search: string }
  groups: { group: ConversationGroup; convs: LocalConversation[] }[]
  activeConversationId: string | null
  collapsedProjects: Record<string, boolean>
  renamingProjectId: string | null
  renameProjectValue: string
  renamingConversationId: string | null
  renameConversationValue: string
  onToggleProject: (id: string) => void
  onNewChat: (projectId: string) => void
  onRenameProjectStart: (id: string, title: string) => void
  onRenameProjectChange: (v: string) => void
  onRenameProjectCommit: () => void
  onRenameProjectCancel: () => void
  onDeleteProject: (id: string, title: string) => void
  onOpenConversation: (c: LocalConversation) => void
  onRenameConversationStart: (c: LocalConversation) => void
  onRenameConversationChange: (v: string) => void
  onRenameConversationCommit: () => void
  onRenameConversationCancel: () => void
  onTogglePin: (c: LocalConversation) => void
  onToggleUnread: (c: LocalConversation) => void
  onDeleteConversation: (c: LocalConversation) => void
  onShareConversation: (c: LocalConversation) => void
  onboarding: ReactNode
}

function ConversationRow({ c, p }: { c: LocalConversation; p: SidebarProps }) {
  const isActive = p.activeConversationId === c.id
  const isRenaming = p.renamingConversationId === c.id
  return (
    <div className="group/item relative mb-0.5">
      <Button
        variant="row"
        onClick={() => p.onOpenConversation(c)}
        aria-current={isActive}
      >
        <span className="flex size-4 shrink-0 items-center justify-center"><MessageCircle className="size-[15px] text-[var(--ap-ink-4,#6b7280)]" /></span>
        {isRenaming ? (
          <Input
            autoFocus
            value={p.renameConversationValue}
            onChange={(e) => p.onRenameConversationChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') p.onRenameConversationCommit(); if (e.key === 'Escape') p.onRenameConversationCancel() }}
            onBlur={p.onRenameConversationCommit}
            onClick={(e) => e.stopPropagation()}
            className="h-6 min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-xs shadow-none focus-visible:bg-transparent focus-visible:ring-0"
          />
        ) : (
          <span className={`min-w-0 flex-1 truncate text-left text-xs ${isActive ? 'font-medium text-[var(--ap-accent-ink,#1e40af)]' : c.unread ? 'font-semibold text-[var(--ap-ink,#111827)]' : 'text-[var(--ap-ink-3,#5b6472)]'}`}>{c.summary}</span>
        )}
        {c.pinned && <PinIcon className="size-2.5 shrink-0 text-[var(--ap-ink-4,#6b7280)]" />}
        {c.unread && <Badge className="size-1.5 shrink-0 bg-primary p-0" aria-hidden="true" />}
      </Button>
      {!isRenaming && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => p.onRenameConversationStart(c)}
          aria-label="Rename chat"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-[var(--ap-ink-4,#6b7280)] transition-opacity md:opacity-0 md:group-hover/item:opacity-100 md:focus-visible:opacity-100"
        >
          <Pencil className="size-[13px]" />
        </Button>
      )}
    </div>
  )
}

function ProjectRow({ g, convs, idx, p }: { g: ConversationGroup; convs: LocalConversation[]; idx: number; p: SidebarProps }) {
  const color = FOLDER_COLORS[idx % FOLDER_COLORS.length]
  const collapsed = !!p.collapsedProjects[g.project.id]
  const isActive = g.conversationIds.includes(p.activeConversationId ?? '')
  const isRenaming = p.renamingProjectId === g.project.id
  const Folder = collapsed ? FolderClosed : FolderOpen
  // Share / Pin / Unread act on the active chat in this project, else its most recent one.
  const target = convs.find((c) => c.id === p.activeConversationId) ?? convs[0]
  return (
    <div className="mb-0.5">
      {/* Row actions are siblings of the toggle (not children) so the menu trigger isn't nested in a button. */}
      <div className="group/proj relative">
        <Button
          variant="row"
          nativeButton={false}
          render={<div />}
          onClick={() => p.onToggleProject(g.project.id)}
          className={`cursor-pointer select-none text-sm ${isRenaming ? '' : 'pr-[60px]'} ${isActive ? 'bg-[rgb(var(--ap-ov,0_0_0)/0.05)]' : ''}`}
        >
          {collapsed ? <ChevronRight className="size-[11px] shrink-0 text-[var(--ap-ink-4,#6b7280)]" /> : <ChevronDown className="size-[11px] shrink-0 text-[var(--ap-ink-4,#6b7280)]" />}
          <Folder className="size-4 shrink-0" style={{ color, fill: color }} />
          {isRenaming ? (
            <Input
              autoFocus
              value={p.renameProjectValue}
              onChange={(e) => p.onRenameProjectChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') p.onRenameProjectCommit(); if (e.key === 'Escape') p.onRenameProjectCancel() }}
              onBlur={p.onRenameProjectCommit}
              onClick={(e) => e.stopPropagation()}
              className="h-6 min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:bg-transparent focus-visible:ring-0"
            />
          ) : (
            <span className={`min-w-0 flex-1 truncate text-sm text-[var(--ap-ink-2,#374151)] ${isActive ? 'font-semibold' : 'font-medium'}`} title={g.project.title}>{g.project.title}</span>
          )}
        </Button>
        {!isRenaming && (
          <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => p.onRenameProjectStart(g.project.id, g.project.title)}
              aria-label={p.labels.renameProject}
              className="text-[var(--ap-ink-4,#6b7280)]"
            >
              <Pencil className="size-[13px]" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Project options" render={<Button variant="ghost" size="icon-xs" className="text-[var(--ap-ink-4,#6b7280)]" />}>
                <MoreHorizontal className="size-[14px]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled={!target} onClick={() => target && p.onShareConversation(target)}><Share2 /> Share</DropdownMenuItem>
                <DropdownMenuItem disabled={!target} onClick={() => target && p.onTogglePin(target)}><PinIcon /> {target?.pinned ? 'Unpin' : 'Pin'}</DropdownMenuItem>
                <DropdownMenuItem disabled={!target} onClick={() => target && p.onToggleUnread(target)}><EyeOff /> {target?.unread ? 'Mark as read' : 'Mark as unread'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => p.onRenameProjectStart(g.project.id, g.project.title)}><Pencil /> Rename</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => p.onDeleteProject(g.project.id, g.project.title)}><Trash2 /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {!collapsed && (
        <div className="mt-0.5 ml-4 pl-2" style={{ borderLeft: `2px solid ${color}50` }}>
          {convs.map((c) => <ConversationRow key={c.id} c={c} p={p} />)}
          <Button variant="row" onClick={() => p.onNewChat(g.project.id)} className="h-8 text-[var(--ap-ink-3,#5b6472)] hover:text-[var(--ap-ink,#111827)]">
            <span className="flex size-4 shrink-0 items-center justify-center"><PlusCircle className="size-[13px]" /></span>
            {p.labels.newChatInProject}
          </Button>
        </div>
      )}
    </div>
  )
}

export function Sidebar(p: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[var(--ap-surface,#fff)]" aria-label="Sidebar">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-sm font-semibold tracking-[0.18em] uppercase">Spectr</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={p.onCollapse} aria-label="Collapse sidebar" className="text-[var(--ap-ink-4,#6b7280)]"><PanelLeft /></Button>
      </div>

      <div className="px-3 pt-4">
        <Button variant="field" onClick={p.onSearch} aria-label={p.labels.search} className="pr-2">
          <Search className="size-4" />
          <span className="flex-1 text-left text-sm">{p.labels.search}</span>
          <Kbd>⌘K</Kbd>
        </Button>
      </div>

      <nav className="px-3 pt-5" aria-label="Menu">
        <p className="ap-label">{p.labels.menu}</p>
        <Button variant="nav" aria-current={p.activeNav === 'home' && !p.chatActive ? 'page' : undefined} onClick={p.onNewProject}>
          <FolderPlus className="size-4" /> {p.labels.newProject}
        </Button>
        <Button variant="nav" className="mt-0.5" aria-current={p.activeNav === 'documents' ? 'page' : undefined} onClick={p.onArtifacts}>
          <FileText className="size-4" /> {p.labels.artifacts}
        </Button>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col px-3 pt-6">
        <p className="ap-label shrink-0">{p.labels.projects}</p>
        <div className="ap-scroll min-h-0 flex-1 overflow-y-auto">
          {p.groups.length === 0
            ? <p className="px-3 text-xs text-[var(--ap-ink-4,#6b7280)]">{p.labels.noChats}</p>
            : p.groups.map(({ group, convs }, i) => <ProjectRow key={group.project.id} g={group} convs={convs} idx={i} p={p} />)}
        </div>
      </div>

      <div className="px-3 pt-2 pb-4">{p.onboarding}</div>
    </aside>
  )
}

export function OnboardingCard({
  done, total, title, next, cta, onCta, segments = 20, filled,
}: { done: number; total: number; title: string; next: string; cta: string; onCta: () => void; segments?: number; filled?: number }) {
  return (
    <div className="ap-ob">
      <svg className="ap-ob__star" style={{ top: '14px', right: '46px', width: '13px', height: '13px' }} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" /></svg>
      <svg className="ap-ob__star" style={{ top: '11px', right: '16px', width: '10px', height: '10px' }} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" /></svg>
      <svg className="ap-ob__star" style={{ top: '28px', right: '26px', width: '8px', height: '8px' }} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" /></svg>
      <div className="relative flex items-center gap-2">
        <Zap className="size-5 text-primary" fill="currentColor" />
        <span className="text-sm font-semibold">{done}/{total}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="relative mt-2 text-[13px] text-[var(--ap-ink-3,#5b6472)]">{next}</p>
      <SegmentedProgress className="relative mt-3" segments={segments} value={filled ?? done} max={filled !== undefined ? segments : total} />
      <Button variant="primary" onClick={onCta} className="relative mt-4 h-10 w-full text-sm font-medium">{cta}</Button>
    </div>
  )
}
