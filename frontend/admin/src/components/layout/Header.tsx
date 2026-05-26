import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import { useI18n } from '@/i18n'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()
  const { t, lang } = useI18n()

  const breadcrumbs: Record<string, string> = {
    '/dashboard':  t.adminNav.dashboard,
    '/hackathons': t.adminNav.hackathons,
    '/teams':      t.adminNav.teams,
    '/users':      t.adminNav.users,
    '/judging':    t.adminNav.judging,
    '/mentorship': t.adminNav.mentorship,
  }

  const base = '/' + pathname.split('/')[1]
  const title = breadcrumbs[base] ?? 'Hack-Flow'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={lang === 'uk' ? 'Відкрити меню' : 'Open menu'}
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-foreground text-sm md:text-base">{title}</span>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <LanguageToggle />
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
  )
}
