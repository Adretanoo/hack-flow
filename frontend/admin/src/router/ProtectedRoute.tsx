import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = true }: ProtectedRouteProps) {
  const { accessToken, user } = useAuthStore()

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user?.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-6xl font-bold text-destructive">403</p>
          <p className="mt-2 text-lg font-semibold">Доступ заборонено</p>
          <p className="text-muted-foreground">У вас немає прав адміністратора.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
