import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Trophy, Users, User, Star, BookOpen, LogOut, Zap, X,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useI18n } from '@/i18n'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useI18n()
  const isOrganizer = user?.role === 'organizer'

  const allNavItems = [
    { to: '/dashboard',  label: t.adminNav.dashboard,    icon: LayoutDashboard },
    { to: '/hackathons', label: t.adminNav.hackathons,   icon: Trophy },
    { to: '/teams',      label: t.adminNav.teams,        icon: Users },
    { to: '/users',      label: t.adminNav.users,        icon: User, adminOnly: true },
    { to: '/judging',    label: t.adminNav.judging,      icon: Star },
    { to: '/mentorship', label: t.adminNav.mentorship,   icon: BookOpen },
  ]
  const navItems = allNavItems.filter(item => !isOrganizer || !item.adminOnly)

  // Close on route change (mobile)
  useEffect(() => { onClose?.() }, [pathname])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const content = (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight">Hack-Flow</span>
        <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
          isOrganizer
            ? 'bg-orange-500/20 text-orange-600'
            : 'bg-primary/20 text-primary'
        }`}>
          {isOrganizer ? 'org' : 'admin'}
        </span>
        {/* Mobile close */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden ml-1 p-1 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            aria-label={t.actions.close}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.fullName ?? 'Admin'}</p>
            <p className="truncate text-xs text-sidebar-foreground/50">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-destructive/20 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t.nav.logout}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden lg:flex h-screen">
        {content}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  )
}
