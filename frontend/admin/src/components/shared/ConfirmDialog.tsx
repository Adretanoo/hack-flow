import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/i18n'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n()

  if (!open) return null

  const displayTitle = title ?? t.shared.areYouSure
  const displayDescription = description ?? t.shared.thisActionCannotBeUndone
  const displayConfirmLabel = confirmLabel ?? t.actions.confirm
  const displayCancelLabel = cancelLabel ?? t.actions.cancel

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-fade-in">
        <div className="mb-4 flex items-start gap-3">
          {danger && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-foreground">{displayTitle}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{displayDescription}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            onClick={onCancel}
          >
            {displayCancelLabel}
          </button>
          <button
            className={
              danger
                ? 'rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors'
                : 'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
            }
            onClick={onConfirm}
          >
            {displayConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
