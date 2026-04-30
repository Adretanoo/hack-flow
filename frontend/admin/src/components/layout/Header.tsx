import { useLocation } from 'react-router-dom'

const BREADCRUMBS: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/hackathons': 'Хакатони',
  '/teams':      'Команди',
  '/users':      'Користувачі',
  '/judging':    'Суддівство',
  '/mentorship': 'Менторство',
}

import { NotificationBell } from '@/components/shared/NotificationBell'

export function Header() {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  const title = BREADCRUMBS[base] ?? 'Hack-Flow'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
      </div>
    </header>
  )
}
