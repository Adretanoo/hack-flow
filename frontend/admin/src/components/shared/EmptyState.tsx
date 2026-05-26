import { FolderOpen } from 'lucide-react'
import { useI18n } from '@/i18n'

interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  const { t } = useI18n()

  const displayTitle = title ?? t.shared.emptyState.defaultTitle
  const displayDescription = description ?? t.shared.emptyState.defaultDesc

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{displayTitle}</h3>
      <p className="mb-6 text-sm text-muted-foreground">{displayDescription}</p>
      {action}
    </div>
  )
}
