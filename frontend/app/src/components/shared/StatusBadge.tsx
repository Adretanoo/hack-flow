import { clsx } from 'clsx'
import { getStatusLabel } from '@/utils/format'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  DISQUALIFIED: 'bg-gray-100 text-gray-600 border-gray-200',
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
  PUBLISHED: 'bg-blue-100 text-blue-800 border-blue-200',
  ARCHIVED: 'bg-gray-100 text-gray-500 border-gray-200',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
  past: 'bg-gray-100 text-gray-500 border-gray-200',
  booked: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        color,
        className,
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}
