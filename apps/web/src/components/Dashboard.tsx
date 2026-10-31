'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { loadConversations, loadConversationGroups, getConversations, getConversationGroups, updateLocalConversation, deleteLocalConversation, renameLocalProject, sortGroupConversations, type LocalConversation, type ConversationGroup } from '../lib/conversations'
import { shareConversation, unshareConversation } from '../api/conversations'
import { deleteProject } from '../api/projects'
import { copyText } from '../lib/clipboard'
import { useUsage } from '../hooks/useUsage'
import { apiUrl } from '../api/base'
import { useLanguage, type StringKey } from '../lib/i18n'
import DocumentsPanel from './DocumentsPanel'
import DocumentReaderPanel from './DocumentReaderPanel'
import ChatView from './app/ChatView'
import Home from './app/Home'
import { Sidebar, OnboardingCard } from './app/Sidebar'
import { TileGrid } from './app/TileGrid'
import { Topbar } from './app/Topbar'
import { SearchDialog } from './app/SearchDialog'
import { AccountDialog, HelpDialog, UpgradeDialog, type AccountTab } from './app/AccountDialog'
import { ConfirmDialog } from './app/ConfirmDialog'
import { ShareDialog } from './app/ShareDialog'
import { useAppTheme } from './app/useAppTheme'
import { Toaster } from './ui/sonner'
import type { PlanUsage } from './app/PromptBox'

type Nav = 'home' | 'documents'

export default function Dashboard({ onBack: _onBack }: { onBack: () => void }) {
  useAppTheme()
  const { t: tr } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<LocalConversation[]>([])
  const [groups, setGroups] = useState<ConversationGroup[]>([])
  const [activeNav, setActiveNav] = useState<Nav>('home')
  const [chatState, setChatState] = useState<{ prompt: string; conversationId: string; autoRun: boolean } | null>(() => {
    const saved = localStorage.getItem('spectr_last_chat')
    if (!saved) return null
    try {
      const parsed = JSON.parse(saved) as { prompt: string; conversationId: string; autoRun?: boolean }
      return { prompt: parsed.prompt, conversationId: parsed.conversationId, autoRun: parsed.autoRun === true }
    } catch { return null }
  })

  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768)
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountTab, setAccountTab] = useState<AccountTab | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [shareTarget, setShareTarget] = useState<LocalConversation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LocalConversation | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null)
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null)
  const [renameConversationValue, setRenameConversationValue] = useState('')
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({})
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null)
  const [renameProjectValue, setRenameProjectValue] = useState('')
  const [composerProjectId, setComposerProjectId] = useState<string | null>(null)
  const [openDocument, setOpenDocument] = useState<{ id: string; fromArtifacts: boolean } | null>(null)

  const { logout, state: authState } = useAuth()
  const usageQuery = useUsage()
  const usage: PlanUsage = usageQuery.data ?? { used: 0, prototypeUsed: 0, chatUsed: 0, limit: 5, prototypeLimit: 3, chatLimit: 100, isPro: false }
  const username = authState.status === 'authenticated' ? (authState.username ?? 'sandwich') : 'sandwich'
  const { data: sub, isLoading: subLoading } = useSubscription()
  const queryClient = useQueryClient()
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768

  // Fire Snap for a pending Pro upgrade set during registration
  useEffect(() => {
    const pending = localStorage.getItem('spectr_pending_plan')
    if (pending !== 'pro') return
    localStorage.removeItem('spectr_pending_plan') // clear immediately — don't loop

    const fireSnap = async () => {
      try {
        const txRes = await fetch(apiUrl('/api/midtrans/transaction'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ planSlug: 'pro' }),
        })
        if (!txRes.ok) return
        const data = await txRes.json() as { token: string | null; simulated: boolean; clientKey: string; isProduction: boolean }
        if (data.simulated || !data.token) {
          queryClient.invalidateQueries({ queryKey: ['subscription'] })
          return
        }
        await new Promise<void>((resolve, reject) => {
          const w = window as unknown as Record<string, unknown>
          if (w.snap) { resolve(); return }
          const script = document.createElement('script')
          script.src = data.isProduction ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js'
          script.setAttribute('data-client-key', data.clientKey)
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Snap.js failed to load'))
          document.head.appendChild(script)
        })
        ;(window as unknown as { snap: { pay: (token: string, opts: Record<string, unknown>) => void } }).snap.pay(data.token, {
          onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscription'] }); toast.success('Pro plan activated', { description: 'Unlimited documents, prototypes, and AI chat.' }) },
          onPending: () => { toast.info('Payment pending', { description: "We'll activate Pro as soon as Midtrans confirms." }) },
          onError: () => { toast.error('Payment failed', { description: "Your payment wasn't completed. You haven't been charged." }) },
          onClose: () => { /* user closed — key already cleared */ },
        })
      } catch { /* transient — key already cleared, user can upgrade manually */ }
    }
    void fireSnap()
  }, [queryClient])

  const refresh = () => {
    setConversations(getConversations())
    setGroups(getConversationGroups())
  }

  useEffect(() => {
    void loadConversationGroups().then(() => {
      refresh()
      // Baseline: only notifications that arrive after this point raise a toast.
      seenNotifs.current = new Set(getConversations().filter((t) => t.status === 'done' && t.unread).map((t) => t.id))
    }).catch(() => {
      // Fall back to the flat list so the sidebar still works.
      void loadConversations().then(setConversations).catch(() => {})
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pick up generations that finish in the background (another tab, or after leaving the chat).
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === 'visible') void loadConversationGroups().then(() => refresh()).catch(() => {})
    }
    const id = window.setInterval(poll, 20000)
    document.addEventListener('visibilitychange', poll)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', poll) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ⌘K / Ctrl+K opens search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen((o) => !o) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const currentConversation = conversations.find((t) => t.id === chatState?.conversationId) ?? null

  // Keep the active conversation's project expanded.
  useEffect(() => {
    const cId = chatState?.conversationId
    if (!cId) return
    const g = groups.find((gr) => gr.conversationIds.includes(cId))
    if (g && collapsedProjects[g.project.id]) setCollapsedProjects((p) => ({ ...p, [g.project.id]: false }))
  }, [chatState?.conversationId, groups, collapsedProjects])

  useEffect(() => {
    if (chatState) {
      localStorage.setItem('spectr_last_chat', JSON.stringify({ prompt: chatState.prompt, conversationId: chatState.conversationId }))
      // Sync conversation ID to URL (?c=<id>) without adding a history entry
      const params = new URLSearchParams(window.location.search)
      if (params.get('c') !== chatState.conversationId) router.replace(`/dashboard?c=${chatState.conversationId}`, { scroll: false })
    } else {
      localStorage.removeItem('spectr_last_chat')
      const params = new URLSearchParams(window.location.search)
      if (params.has('c')) router.replace('/dashboard', { scroll: false })
    }
  }, [chatState?.conversationId, router])

  // Restore conversation from ?c= URL param on first load
  useEffect(() => {
    const cId = searchParams.get('c')
    if (!cId || chatState?.conversationId === cId) return
    void loadConversationGroups()
      .then(() => {
        refresh()
        let match = getConversations().find((c) => c.id === cId)
        if (match) { setChatState({ prompt: match.summary, conversationId: match.id, autoRun: false }); return }
        // Not in the grouped result (null project_id / legacy) — flat fallback.
        return loadConversations().then((convs) => {
          setConversations(convs)
          match = convs.find((c) => c.id === cId)
          if (match) setChatState({ prompt: match.summary, conversationId: match.id, autoRun: false })
        })
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle browser back/forward between conversations
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      if (e.state?.activeNav) { setActiveNav(e.state.activeNav); setChatState(null); return }
      const cId = new URLSearchParams(window.location.search).get('c')
      if (!cId) { setChatState(null); return }
      const match = getConversations().find((c) => c.id === cId)
      if (match) setChatState({ prompt: match.summary, conversationId: match.id, autoRun: false })
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const visibleGroups = useMemo(() => {
    const byId = new Map(conversations.map((c) => [c.id, c]))
    return groups
      .map((g) => ({ group: g, convs: sortGroupConversations(g.conversationIds, byId) }))
      .filter((x) => x.convs.length > 0)
  }, [groups, conversations])

  const openConversation = (t: LocalConversation) => {
    setChatState({ prompt: t.summary, conversationId: t.id, autoRun: false })
    setActiveNav('home')
    if (t.unread) { updateLocalConversation(t.id, { unread: false }); refresh() }
    if (isMobile()) setSidebarOpen(false)
  }

  const goNewProject = () => {
    setActiveNav('home'); setChatState(null); setComposerProjectId('')
    if (isMobile()) setSidebarOpen(false)
  }

  const goArtifacts = () => {
    setActiveNav('documents'); setChatState(null)
    if (isMobile()) setSidebarOpen(false)
  }

  const handleSuccess = (t: LocalConversation) => {
    setComposerProjectId(null)
    usageQuery.invalidate()
    setChatState({ prompt: t.summary, conversationId: t.id, autoRun: true })
    // A project-less create minted a fresh project server-side — reload groups.
    void loadConversationGroups().then(() => refresh()).catch(() => refresh())
  }

  // "+ New chat" inside a project — opens the composer carrying that project.
  const startChatInProject = (projectId: string, autoRename = false) => {
    setComposerProjectId(projectId)
    setChatState(null)
    setActiveNav('home')
    setCollapsedProjects((p) => ({ ...p, [projectId]: false }))
    if (autoRename) {
      setRenameProjectValue(groups.find((g) => g.project.id === projectId)?.project.title ?? '')
      setRenamingProjectId(projectId)
    }
    if (isMobile()) setSidebarOpen(false)
  }

  const commitProjectRename = () => {
    if (renamingProjectId && renameProjectValue.trim()) { renameLocalProject(renamingProjectId, renameProjectValue.trim()); refresh() }
    setRenamingProjectId(null)
  }

  const commitConversationRename = () => {
    if (renamingConversationId && renameConversationValue.trim()) {
      updateLocalConversation(renamingConversationId, { summary: renameConversationValue.trim() })
      if (chatState?.conversationId === renamingConversationId) setChatState((prev) => (prev ? { ...prev, prompt: renameConversationValue.trim() } : prev))
      refresh()
    }
    setRenamingConversationId(null)
  }

  const togglePin = (c: LocalConversation) => { updateLocalConversation(c.id, { pinned: !c.pinned }); refresh() }
  const toggleUnread = (c: LocalConversation) => { updateLocalConversation(c.id, { unread: !c.unread }); refresh() }

  const handleChatPromptUpdate = (text: string) => {
    if (!currentConversation) return
    updateLocalConversation(currentConversation.id, { summary: text, description: text })
    setChatState((prev) => (prev ? { ...prev, prompt: text } : prev))
    refresh()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const t = deleteTarget
    deleteLocalConversation(t.id)
    if (chatState?.conversationId === t.id) setChatState(null)
    refresh()
    toast.info('Chat deleted', { description: `"${t.summary}" was removed.` })
    setDeleteTarget(null)
  }

  // The API refuses to delete a project that still has chats, so remove its chats first.
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return
    const { id, title } = projectToDelete
    const ids = groups.find((g) => g.project.id === id)?.conversationIds ?? []
    try {
      ids.forEach((cid) => deleteLocalConversation(cid))
      await deleteProject(id)
      if (chatState && ids.includes(chatState.conversationId)) setChatState(null)
      if (composerProjectId === id) setComposerProjectId(null)
      await loadConversationGroups().catch(() => {})
      refresh()
      toast.info('Project deleted', { description: `"${title}" was removed.` })
    } catch {
      toast.error("Couldn't delete project", { description: 'Try again in a moment.' })
      await loadConversationGroups().catch(() => {})
      refresh()
    }
    setProjectToDelete(null)
  }

  const handleCreateShareLink = async (visibility: 'private' | 'shared') => {
    if (!shareTarget) return
    try {
      let url: string
      if (visibility === 'shared') {
        const { url: sharePath } = await shareConversation(shareTarget.id)
        url = `${window.location.origin}${sharePath}`
      } else {
        await unshareConversation(shareTarget.id).catch(() => {})
        url = `${window.location.origin}/dashboard`
      }
      setShareTarget(null)
      if (!(await copyText(url, 'Share link copied'))) toast.info('Share link ready', { description: url })
    } catch {
      toast.error("Couldn't create share link", { description: 'Check your connection and try again.' })
    }
  }

  const openConversationFromDoc = (convId: string | null, docTitle: string) => {
    const conv = convId ? conversations.find((c) => c.id === convId) : conversations.find((c) => c.summary.includes(docTitle))
    if (conv) {
      history.pushState({ activeNav: 'documents' }, '')
      setChatState({ prompt: conv.summary, conversationId: conv.id, autoRun: false })
      setActiveNav('home')
      setOpenDocument(null)
    }
  }

  const notifications = conversations.filter((t) => t.status === 'done' && t.unread)
  const seenNotifs = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (seenNotifs.current === null) return
    for (const n of notifications) {
      if (seenNotifs.current.has(n.id) || n.id === chatState?.conversationId) continue
      toast.success(`${n.summary} ${tr('dash_notif_ready')}`, { action: { label: tr('dash_notif_open'), onClick: () => openConversation(n) } })
    }
    seenNotifs.current = new Set(notifications.map((n) => n.id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications])
  const markAllNotificationsRead = () => { notifications.forEach((n) => updateLocalConversation(n.id, { unread: false })); refresh() }

  // ── Onboarding / usage card ────────────────────────────────────────────────
  const checklist: { key: StringKey; done: boolean; run: () => void }[] = [
    { key: 'home_check_1', done: conversations.length > 0, run: goNewProject },
    { key: 'home_check_2', done: conversations.some((t) => t.status === 'done'), run: goNewProject },
    { key: 'home_check_3', done: new Set(conversations.map((t) => t.type)).size >= 3, run: goNewProject },
    { key: 'home_check_5', done: usage.isPro, run: () => setUpgradeOpen(true) },
  ]
  const checklistDone = checklist.filter((c) => c.done).length
  const nextStep = checklist.find((c) => !c.done)
  let onboarding: React.ReactNode = null
  // Wait for real usage data: the default (isPro: false) would flash the free-plan card at Pro users.
  if (!usageQuery.data) {
    onboarding = null
  } else if (!usage.isPro && usage.limit !== null) {
    const left = usage.limit - usage.used
    onboarding = (
      <OnboardingCard
        done={usage.used} total={usage.limit} title="Documents"
        next={left <= 0 ? `You've used all ${usage.limit} documents this month.` : left <= 2 ? 'Your free documents are running out!' : 'Free documents this month.'}
        cta="Upgrade Now" onCta={() => setUpgradeOpen(true)}
      />
    )
  } else {
    onboarding = (
      <OnboardingCard
        done={checklistDone} total={checklist.length} title="Mulai perjalananmu"
        next={nextStep ? `Next: ${tr(nextStep.key)}` : 'All set. Keep shipping specs.'}
        cta={nextStep ? 'Continue' : 'New project'} onCta={nextStep ? nextStep.run : goNewProject}
      />
    )
  }

  const title = chatState ? (currentConversation?.summary ?? chatState.prompt) : activeNav === 'documents' ? 'Artifacts' : composerProjectId ? tr('dash_new_chat') : tr('dash_new_project')
  const planLabel = sub?.planSlug === 'pro' ? 'Pro' : 'Starter'

  if (!subLoading && sub !== undefined && !sub?.planSlug) {
    return (
      <div className="ap-root flex min-h-screen items-center justify-center bg-[rgb(var(--ap-ov,0_0_0)/0.06)]">
        <div className="max-w-sm px-4 text-center">
          <p className="mb-4 text-sm text-[var(--ap-ink-3,#5b6472)]">No active plan found. Please contact support.</p>
          <a href="mailto:hello@etalas.com" className="text-sm font-semibold text-primary underline">hello@etalas.com</a>
        </div>
      </div>
    )
  }

  return (
    <div className="ap-root flex h-dvh overflow-hidden">
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 z-50 md:static md:z-auto">
            <Sidebar
              activeNav={activeNav}
              chatActive={!!chatState}
              onNewProject={goNewProject}
              onArtifacts={goArtifacts}
              onSearch={() => setSearchOpen(true)}
              onCollapse={() => setSidebarOpen(false)}
              labels={{ menu: 'Menu', newProject: tr('dash_new_project'), artifacts: 'Artifacts', projects: tr('dash_projects'), noChats: tr('dash_no_chats'), newChatInProject: tr('dash_new_chat_in_project'), renameProject: tr('dash_rename_project'), search: 'Search…' }}
              groups={visibleGroups}
              activeConversationId={chatState?.conversationId ?? null}
              collapsedProjects={collapsedProjects}
              renamingProjectId={renamingProjectId}
              renameProjectValue={renameProjectValue}
              renamingConversationId={renamingConversationId}
              renameConversationValue={renameConversationValue}
              onToggleProject={(id) => {
                const nowCollapsed = !!collapsedProjects[id]
                setCollapsedProjects((p) => ({ ...p, [id]: !p[id] }))
                if (nowCollapsed && !chatState) { setComposerProjectId(id); setActiveNav('home') } // expanding with no active chat → composer with project context
              }}
              onNewChat={(id) => startChatInProject(id, true)}
              onRenameProjectStart={(id, t) => { setRenameProjectValue(t); setRenamingProjectId(id) }}
              onRenameProjectChange={setRenameProjectValue}
              onRenameProjectCommit={commitProjectRename}
              onRenameProjectCancel={() => setRenamingProjectId(null)}
              onDeleteProject={(id, title) => setProjectToDelete({ id, title })}
              onOpenConversation={openConversation}
              onRenameConversationStart={(c) => { setRenameConversationValue(c.summary); setRenamingConversationId(c.id) }}
              onRenameConversationChange={setRenameConversationValue}
              onRenameConversationCommit={commitConversationRename}
              onRenameConversationCancel={() => setRenamingConversationId(null)}
              onTogglePin={togglePin}
              onToggleUnread={toggleUnread}
              onDeleteConversation={setDeleteTarget}
              onShareConversation={setShareTarget}
              onboarding={onboarding}
            />
          </div>
        </>
      )}

      <main className="ap-main" id="main">
        <TileGrid />
        <Topbar
          title={title}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          username={username}
          plan={planLabel}
          notifications={notifications}
          noNotificationsLabel={tr('dash_no_notifications')}
          finishedLabel={tr('dash_finished_processing')}
          notificationsTitle={tr('dash_notifications')}
          markAllReadLabel={tr('dash_mark_all_read')}
          onMarkAllRead={markAllNotificationsRead}
          onOpenNotification={openConversation}
          onHelp={() => setHelpOpen(true)}
          onSettings={() => setAccountTab('settings')}
          onSignOut={() => setSignOutOpen(true)}
        />

        {chatState ? (
          <div className="relative z-[1] min-h-0 flex-1">
            <ChatView
              key={chatState.conversationId}
              initialPrompt={chatState.prompt}
              conversationId={chatState.conversationId}
              createdAt={currentConversation?.createdAt ?? new Date().toISOString()}
              autoRun={chatState.autoRun}
              onPromptUpdate={handleChatPromptUpdate}
              onOpenDocument={(id) => setOpenDocument({ id, fromArtifacts: false })}
            />
          </div>
        ) : activeNav === 'documents' ? (
          <DocumentsPanel
            onOpenDocument={(id) => setOpenDocument({ id, fromArtifacts: true })}
            onOpenConversation={openConversationFromDoc}
          />
        ) : (
          <Home
            usage={usage}
            onSuccess={handleSuccess}
            projectId={composerProjectId}
            projectTitle={composerProjectId ? (groups.find((g) => g.project.id === composerProjectId)?.project.title ?? null) : null}
            onClearProject={() => setComposerProjectId(null)}
            onUpgrade={() => setUpgradeOpen(true)}
          />
        )}
      </main>

      <DocumentReaderPanel
        documentId={openDocument?.id ?? null}
        onClose={() => setOpenDocument(null)}
        onGoToChat={openDocument?.fromArtifacts ? (doc) => openConversationFromDoc(doc.conversationId, doc.title) : undefined}
      />

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        conversations={conversations}
        onOpenConversation={openConversation}
        onNewProject={goNewProject}
        onArtifacts={goArtifacts}
        onSettings={() => setAccountTab('settings')}
        placeholder="Search…"
      />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <AccountDialog tab={accountTab} onTabChange={setAccountTab} onClose={() => setAccountTab(null)} />
      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <ShareDialog open={shareTarget !== null} onOpenChange={(o) => { if (!o) setShareTarget(null) }} onCreate={handleCreateShareLink} />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title="Delete chat?"
        message={`Are you sure you want to delete “${deleteTarget?.summary ?? ''}”?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={projectToDelete !== null}
        onOpenChange={(o) => { if (!o) setProjectToDelete(null) }}
        title="Delete project?"
        message={`This will permanently delete “${projectToDelete?.title ?? ''}” including all its chats. This can't be undone.`}
        confirmLabel="Delete project"
        onConfirm={() => void confirmDeleteProject()}
      />
      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        icon={LogOut}
        title="Sign out?"
        message="You'll need to sign in again to access your account."
        confirmLabel="Sign out"
        onConfirm={() => void logout()}
      />
      <Toaster />
    </div>
  )
}
