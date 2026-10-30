import { ChevronDownIcon, FileText } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const DELIVERABLE_TYPES = [
  { value: '', label: 'Auto' },
  { value: 'prd', label: 'PRD' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'specs', label: 'Specs' },
] as const

const LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  DELIVERABLE_TYPES.map((t) => [t.value, t.label]),
)

export function DeliverableTypeSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
      <SelectTrigger className="ap-pill h-10 gap-2 rounded-[12px] border-black/[0.08] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-white">
        <FileText className="size-4" />
        <SelectValue>{(v) => (v ? LABEL_BY_VALUE[v as string] : 'Document type')}</SelectValue>
        <SelectIcon>
          <ChevronDownIcon className="size-3.5 text-gray-400" />
        </SelectIcon>
      </SelectTrigger>
      <SelectContent>
        {DELIVERABLE_TYPES.map((t) => (
          <SelectItem key={t.value || 'auto'} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
