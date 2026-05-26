import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { LogOut, Menu } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { NotificationBell } from '@/components/shared/NotificationBell'

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4 md:px-8 gap-3">
        {/* Hamburger — only in cabinet (when onMenuClick is provided) */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Відкрити меню"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link to="/" className="flex items-center space-x-2 mr-4">
          <span className="font-bold sm:inline-block text-xl">Hack-Flow</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Desktop nav links — hidden on mobile */}
          <nav className="hidden sm:flex items-center space-x-6 text-sm font-medium mr-2">
            <Link to="/" className="transition-colors hover:text-foreground/80 text-foreground/60">Хакатони</Link>
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link to="/app" className="hidden sm:inline text-sm font-medium text-foreground/60 hover:text-foreground/80">
                  Кабінет
                </Link>
                <NotificationBell />
                <Link to="/app/profile" className="flex items-center gap-2 hover:bg-accent rounded-md p-1.5 transition-colors">
                  <Avatar name={user.fullName} url={user.avatarUrl} size="sm" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Вийти"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-3 py-1.5 text-sm font-medium hover:bg-accent rounded-md transition-colors">Вхід</Link>
                <Link to="/register" className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Реєстрація</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
