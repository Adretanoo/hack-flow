import { formatDateTime } from '@/utils/format'
import type { TeamApproval, TeamStatus } from '@/types/api.types'
import { clsx } from 'clsx'

const STATUS_DOT: Record<TeamStatus, string> = {
  PENDING:      'bg-amber-400',
  APPROVED:     'bg-green-500',
  REJECTED:     'bg-red-500',
  DISQUALIFIED: 'bg-gray-500',
}

interface ApprovalTimelineProps {
  entries: TeamApproval[]
}

export function ApprovalTimeline({ entries }: ApprovalTimelineProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Записів про затвердження ще немає.</p>
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />

      {sorted.map((entry, i) => (
        <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Dot */}
          <div className={clsx(
            'relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full flex items-center justify-center ring-2 ring-background',
            STATUS_DOT[entry.status],
          )}>
            <span className="text-[8px] font-bold text-white">
              {entry.status.charAt(0)}
            </span>
          </div>

          {/* Content */}
          <div className={clsx('flex-1 rounded-lg border border-border bg-card px-4 py-3', i === 0 && 'ring-1 ring-primary/20')}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={clsx(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                entry.status === 'APPROVED'     ? 'bg-green-100 text-green-700' :
                entry.status === 'REJECTED'     ? 'bg-red-100 text-red-700' :
                entry.status === 'DISQUALIFIED' ? 'bg-gray-100 text-gray-600' :
                                                  'bg-amber-100 text-amber-700',
              )}>
                {entry.status}
              </span>
              <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
            </div>
            {entry.comment && (
              <p className="mt-1.5 text-sm text-foreground">{entry.comment}</p>
            )}
            {entry.approvedBy && (
              <p className="mt-1 text-xs text-muted-foreground">
                {entry.approvedBy.fullName} · {entry.approvedBy.email}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
