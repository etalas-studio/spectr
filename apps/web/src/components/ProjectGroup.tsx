import type { ReactNode } from 'react'
import type { ProjectSummary } from '../lib/conversations'

const FOLDER_COLORS = [
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#f97316', // orange
  '#0d9488', // teal
  '#3b82f6', // blue
  '#ec4899', // pink
]

interface ProjectGroupProps {
  project: ProjectSummary
  colorIndex: number
  collapsed: boolean
  isActive: boolean
  isRenaming: boolean
  renameValue: string
  newChatLabel: string
  renameLabel: string
  onToggle: () => void
  onNewChat: () => void
  onRenameStart: () => void
  onRenameChange: (v: string) => void
  onRenameCommit: () => void
  onRenameCancel: () => void
  children: ReactNode
}

export default function ProjectGroup({
  project,
  colorIndex,
  collapsed,
  isActive,
  isRenaming,
  renameValue,
  newChatLabel,
  renameLabel,
  onToggle,
  onNewChat,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  children,
}: ProjectGroupProps) {
  const color = FOLDER_COLORS[colorIndex % FOLDER_COLORS.length]

  return (
    <div className="mb-0.5 relative group/proj">
      {/* Folder header row */}
      <div
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer select-none relative"
        style={{ backgroundColor: isActive ? 'rgba(0,0,0,0.05)' : '' }}
        onClick={onToggle}
      >
        {/* Chevron */}
        <iconify-icon
          icon={collapsed ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-down-linear'}
          width="11"
          style={{ color: 'rgba(0,0,0,0.3)', flexShrink: 0 }}
        />

        {/* Colored folder icon */}
        <iconify-icon icon="solar:folder-bold" width="16" style={{ color, flexShrink: 0 }} />

        {/* Title / rename input */}
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameCommit()
              if (e.key === 'Escape') onRenameCancel()
            }}
            onBlur={onRenameCommit}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
            style={{ color: '#111827' }}
          />
        ) : (
          <span
            className="text-sm flex-1 overflow-hidden"
            style={{ color: '#374151', fontWeight: isActive ? 600 : 500, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}
            title={project.title}
          >
            {project.title}
          </span>
        )}

        {/* ⋯ → directly triggers rename */}
        {!isRenaming && (
          <button
            onClick={(e) => { e.stopPropagation(); onRenameStart() }}
            aria-label={renameLabel}
            className="p-1 rounded hover:bg-black/8 transition-colors shrink-0"
            style={{ color: 'rgba(0,0,0,0.4)' }}
          >
            <iconify-icon icon="solar:pen-2-linear" width="13" />
          </button>
        )}
      </div>

      {/* Expanded chat list with colored left border */}
      {!collapsed && (
        <div className="ml-4 pl-2 mt-0.5" style={{ borderLeft: `2px solid ${color}50` }}>
          {children}
          {/* New chat row — px-3 + gap-2 + w-5 icon matches renderConversationRow */}
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors text-left"
            style={{ color: 'rgba(0,0,0,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.backgroundColor = `${color}10` }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(0,0,0,0.3)'; e.currentTarget.style.backgroundColor = '' }}
          >
            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
              <iconify-icon icon="solar:add-circle-linear" width="13" />
            </div>
            {newChatLabel}
          </button>
        </div>
      )}
    </div>
  )
}
