import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { NotificationBell } from '@/components/shared/NotificationBell'

const BREADCRUMBS: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/hackathons': 'Хакатони',
  '/teams':      'Команди',
  '/users':      'Користувачі',
  '/judging':    'Суддівство',
  '/mentorship': 'Менторство',
}

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  const title = BREADCRUMBS[base] ?? 'Hack-Flow'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Відкрити меню"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-foreground text-sm md:text-base">{title}</span>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <NotificationBell />
      </div>
    </header>
  )
}
