import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface BulkApprovalBarProps {
  count: number
  onApprove: () => void
  onReject: () => void
  onClear: () => void
  loading?: boolean
}

export function BulkApprovalBar({ count, onApprove, onReject, onClear, loading }: BulkApprovalBarProps) {
  if (count === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-2xl shadow-black/20">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
          {count} {count === 1 ? 'команду' : count < 5 ? 'команди' : 'команд'} обрано
        </span>

        <div className="h-4 w-px bg-border" />

        <button
          onClick={onApprove}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Схвалити всі
        </button>

        <button
          onClick={onReject}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Відхилити всі
        </button>

        <button
          onClick={onClear}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Скасувати
        </button>
      </div>
    </div>
  )
}
