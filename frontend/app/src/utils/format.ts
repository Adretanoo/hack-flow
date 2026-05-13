import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { uk } from 'date-fns/locale'

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: uk })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm', { locale: uk })
  } catch {
    return dateStr
  }
}

export function formatTime24h(dateStr: string | Date): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(d, 'HH:mm')
  } catch {
    return String(dateStr)
  }
}

export function formatDateTime24h(dateStr: string | Date): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(d, 'dd MMM yyyy, HH:mm', { locale: uk })
  } catch {
    return String(dateStr)
  }
}

export function formatRelative(dateStr: string | Date): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return formatDistanceToNow(d, { addSuffix: false, locale: uk })
  } catch {
    return String(dateStr)
  }
}

/** Alias for formatRelative — used in judge pages */
export const formatRelativeTime = formatRelative

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Чернетка',
  PUBLISHED: 'Опубліковано',
  ARCHIVED: 'Архів',
  PENDING: 'На розгляді',
  APPROVED: 'Схвалено',
  REJECTED: 'Відхилено',
  DISQUALIFIED: 'Дискваліфіковано',
  upcoming: 'Майбутній',
  active: 'Активний',
  past: 'Завершено',
  booked: 'Заброньовано',
  completed: 'Завершено',
  cancelled: 'Скасовано',
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function truncate(str: string, n = 60): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function getMentorSlotStatusMeta(status: string) {
  switch (status) {
    case 'FREE':
    case 'free':
      return { label: 'Вільний', icon: '🟢', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
    case 'PENDING':
    case 'pending':
      return { label: 'Очікує підтвердження', icon: '🟡', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' }
    case 'BOOKED':
    case 'booked':
      return { label: 'Заброньовано', icon: '🔵', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' }
    case 'COMPLETED':
    case 'completed':
      return { label: 'Завершено', icon: '⚫', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
    default:
      return { label: status, icon: '⚪', className: 'bg-muted text-muted-foreground' }
  }
}
