import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { ReactNode } from 'react'

export function RoleGuard({ roles, children }: { roles: string[], children: ReactNode }) {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/login" />
  if (!roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Немає доступу</h2>
        <p className="text-muted-foreground">Ваша роль ({user.role}) не дозволяє переглядати цю сторінку.</p>
      </div>
    )
  }

  return <>{children}</>
}
