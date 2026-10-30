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
  prd:       { label: 'PRD',       icon: FileText,         tint: 'var(--ap-m-prd-tint)', ink: 'var(--ap-m-prd-ink)', wash: 'var(--ap-m-prd-wash)' },
  prototype: { label: 'Prototype', icon: LayoutGrid,       tint: 'var(--ap-m-prototype-tint)', ink: 'var(--ap-m-prototype-ink)', wash: 'var(--ap-m-prototype-wash)' },
  quotation: { label: 'Quotation', icon: CircleDollarSign, tint: 'var(--ap-m-quotation-tint)', ink: 'var(--ap-m-quotation-ink)', wash: 'var(--ap-m-quotation-wash)' },
  specs:     { label: 'Specs',     icon: ListChecks,       tint: 'var(--ap-m-specs-tint)', ink: 'var(--ap-m-specs-ink)', wash: 'var(--ap-m-specs-wash)' },
  mom:       { label: 'MOM',       icon: NotebookText,     tint: 'var(--ap-m-blue-tint)', ink: 'var(--ap-m-blue-ink)', wash: 'var(--ap-m-blue-wash)' },
  workflow:  { label: 'Workflow',  icon: Workflow,         tint: 'var(--ap-m-blue-tint)', ink: 'var(--ap-m-blue-ink)', wash: 'var(--ap-m-blue-wash)' },
  general:   { label: 'Brief',     icon: StickyNote,       tint: 'var(--ap-m-general-tint)', ink: 'var(--ap-m-general-ink)', wash: 'var(--ap-m-general-wash)' },
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
