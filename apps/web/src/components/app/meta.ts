import {
  FileText,
  LayoutGrid,
  CircleDollarSign,
  ListChecks,
  NotebookText,
  Workflow,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'

export interface TypeMeta {
  label: string
  icon: LucideIcon
  tint: string
  ink: string
  /** Gradient for artifact card thumbnails without a live preview. */
  wash: string
}

// Type colours come from the design tokens (--type-*-tint / --type-*-ink).
export const TYPE_META: Record<string, TypeMeta> = {
  prd:       { label: 'PRD',       icon: FileText,         tint: 'rgba(38,94,228,0.12)', ink: '#265ee4', wash: 'linear-gradient(135deg,#e8f0ff 0%,#dbe7ff 100%)' },
  prototype: { label: 'Prototype', icon: LayoutGrid,       tint: '#d9f2ee', ink: '#0d9488', wash: 'linear-gradient(135deg,#f0fdfa 0%,#ccfbf1 100%)' },
  quotation: { label: 'Quotation', icon: CircleDollarSign, tint: '#ede9fe', ink: '#7c3aed', wash: 'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)' },
  specs:     { label: 'Specs',     icon: ListChecks,       tint: '#ffedd5', ink: '#f97316', wash: 'linear-gradient(135deg,#fff7ed 0%,#fed7aa 100%)' },
  mom:       { label: 'MOM',       icon: NotebookText,     tint: '#dbeafe', ink: '#265ee4', wash: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)' },
  workflow:  { label: 'Workflow',  icon: Workflow,         tint: '#dbeafe', ink: '#265ee4', wash: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)' },
  general:   { label: 'Brief',     icon: StickyNote,       tint: 'rgba(0,0,0,0.06)', ink: '#6b7280', wash: 'linear-gradient(135deg,#f9fafb 0%,#f3f4f6 100%)' },
}

export const typeMeta = (type?: string | null): TypeMeta => TYPE_META[type ?? ''] ?? TYPE_META.general

export const FOLDER_COLORS = ['#f59e0b', '#8b5cf6', '#f97316', '#0d9488', '#265ee4', '#ec4899']

export const DOWNLOAD_FORMATS = [
  { ext: 'pdf', label: 'PDF' },
  { ext: 'doc', label: 'Word (.doc)' },
  { ext: 'md', label: 'Markdown' },
  { ext: 'html', label: 'HTML' },
  { ext: 'csv', label: 'CSV' },
] as const
