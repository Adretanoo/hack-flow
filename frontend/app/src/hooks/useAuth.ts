import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth.store'
import { useEffect } from 'react'

export function useAuth() {
  const { accessToken, user, setUser, logout } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getMe(),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  useEffect(() => {
    if (data?.data) {
      setUser(data.data as any)
    } else if (error) {
      logout()
    }
  }, [data, error, setUser, logout])

  return {
    user: user || data?.data,
    isLoading: isLoading && !!accessToken,
    isAuthenticated: !!accessToken && !!user,
  }
}
