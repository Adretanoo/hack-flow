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

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: uk })
  } catch {
    return dateStr
  }
}

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
  past: 'Минулий',
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
