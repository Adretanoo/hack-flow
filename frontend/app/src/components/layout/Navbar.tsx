import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { LogOut } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { NotificationBell } from '@/components/shared/NotificationBell'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4 md:px-8">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold sm:inline-block text-xl">Hack-Flow</span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="transition-colors hover:text-foreground/80 text-foreground/60">Хакатони</Link>
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link to="/app" className="text-sm font-medium text-foreground/60 hover:text-foreground/80">
                  Кабінет
                </Link>
                <NotificationBell />
                <div className="flex items-center space-x-2">
                  <Link to="/app/profile" className="flex items-center gap-2 hover:bg-accent rounded-md p-1.5 transition-colors">
                    <Avatar name={user.fullName} url={user.avatarUrl} size="sm" />
                  </Link>
                  <button onClick={handleLogout} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Вийти">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors">Вхід</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Реєстрація</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

