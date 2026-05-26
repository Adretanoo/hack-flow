import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useI18n } from '@/i18n'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n()

  const displayConfirmLabel = confirmLabel ?? t.actions.confirm
  const displayCancelLabel = cancelLabel ?? t.actions.cancel

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between px-5 py-4 border-b border-border ${danger ? 'bg-destructive/5' : 'bg-muted/30'}`}>
          <div className="flex items-center gap-3">
            {danger && <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />}
            <h3 className="font-bold text-base">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-accent transition-colors">
            {displayCancelLabel}
          </button>
          <button onClick={() => { onConfirm(); }} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${danger ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
            {displayConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
