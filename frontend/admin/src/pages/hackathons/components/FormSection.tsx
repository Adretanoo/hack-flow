import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

interface FormSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function FormSection({ title, children, defaultOpen = true }: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-foreground">{title}</span>
        <ChevronDown className={clsx('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t border-border px-5 py-5 space-y-4">{children}</div>}
    </div>
  )
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

export const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors placeholder:text-muted-foreground'
export const textareaCls = inputCls + ' resize-none'
