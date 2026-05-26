import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { uk, enUS } from 'date-fns/locale'

export function formatDate(dateStr: string, lang = 'uk'): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: lang === 'uk' ? uk : enUS })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string, lang = 'uk'): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm', { locale: lang === 'uk' ? uk : enUS })
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

export function formatDateTime24h(dateStr: string | Date, lang = 'uk'): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(d, 'dd MMM yyyy, HH:mm', { locale: lang === 'uk' ? uk : enUS })
  } catch {
    return String(dateStr)
  }
}

export function formatRelative(dateStr: string | Date, lang = 'uk'): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return formatDistanceToNow(d, { addSuffix: false, locale: lang === 'uk' ? uk : enUS })
  } catch {
    return String(dateStr)
  }
}

/** Alias for formatRelative — used in judge pages */
export const formatRelativeTime = formatRelative

export const STATUS_LABELS_UK: Record<string, string> = {
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

export const STATUS_LABELS_EN: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DISQUALIFIED: 'Disqualified',
  upcoming: 'Upcoming',
  active: 'Active',
  past: 'Past',
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function getStatusLabel(status: string, lang = 'uk'): string {
  const labels = lang === 'uk' ? STATUS_LABELS_UK : STATUS_LABELS_EN
  return labels[status] ?? status
}

export function truncate(str: string, n = 60): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function getMentorSlotStatusMeta(status: string, lang = 'uk') {
  switch (status) {
    case 'FREE':
    case 'free':
      return { label: lang === 'uk' ? 'Вільний' : 'Free', icon: '🟢', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
    case 'PENDING':
    case 'pending':
      return { label: lang === 'uk' ? 'Очікує підтвердження' : 'Pending', icon: '🟡', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' }
    case 'BOOKED':
    case 'booked':
      return { label: lang === 'uk' ? 'Заброньовано' : 'Booked', icon: '🔵', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' }
    case 'COMPLETED':
    case 'completed':
      return { label: lang === 'uk' ? 'Завершено' : 'Completed', icon: '⚫', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
    default:
      return { label: status, icon: '⚪', className: 'bg-muted text-muted-foreground' }
  }
}
