import { Link, useLocation } from 'react-router-dom'
import { Trophy, UserSearch, User, FileText, Star, AlertTriangle, Calendar, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

export function Sidebar() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()


  const isJudge = user?.role === 'judge' || user?.role === 'admin'

  const navItems = isJudge ? [
    { name: 'Проєкти', href: '/app/judge/projects', icon: FileText },
    { name: 'Оцінки', href: '/app/judge/scores', icon: Star },
    { name: 'Конфлікти', href: '/app/judge/conflicts', icon: AlertTriangle },
    { name: 'Профіль', href: '/app/profile', icon: User },
  ] : [
    { name: 'Хакатони', href: '/app/hackathons', icon: Trophy },
    { name: 'Пошук команди', href: '/app/matchmaking', icon: UserSearch },
    ...(user?.role === 'mentor' || user?.role === 'admin' ? [
      { name: 'Мої слоти', href: '/app/mentor/slots', icon: Calendar },
      { name: 'Розклад', href: '/app/mentor/availability', icon: Clock },
    ] : []),
    { name: 'Профіль', href: '/app/profile', icon: User },
  ]

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
