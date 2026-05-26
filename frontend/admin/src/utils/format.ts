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

export function formatRelative(dateStr: string, lang = 'uk'): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: lang === 'uk' ? uk : enUS })
  } catch {
    return dateStr
  }
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT:         'Чернетка',
  PUBLISHED:     'Опубліковано',
  ARCHIVED:      'Архів',
  PENDING:       'Очікує',
  APPROVED:      'Схвалено',
  REJECTED:      'Відхилено',
  DISQUALIFIED:  'Дискваліфіковано',
  upcoming:      'Майбутні',
  active:        'Активні',
  past:          'Завершені',
  booked:        'Заброньовано',
  completed:     'Завершено',
  cancelled:     'Скасовано',
  SUBMITTED:     'Подано',
  REVIEWED:      'Переглянуто',
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function truncate(str: string, n = 60): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}
