import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useMutation } from '@tanstack/react-query'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: ({ data }) => {
      const { accessToken, refreshToken, user } = data.data
      store.setTokens(accessToken, refreshToken)
      store.setUser(user)
      navigate('/dashboard')
    },
  })

  const logout = () => {
    store.logout()
    navigate('/login')
  }

  return {
    user: store.user,
    accessToken: store.accessToken,
    isAuthenticated: !!store.accessToken,
    isAdmin: store.isAdmin(),
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    loginPending: loginMutation.isPending,
    logout,
  }
}
