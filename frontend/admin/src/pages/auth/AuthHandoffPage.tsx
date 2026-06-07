/**
 * AuthHandoffPage — обробляє автоматичну передачу токенів з app (5174) в admin (5173).
 * URL формат: /auth-handoff#at=<accessToken>&rt=<refreshToken>&u=<encodedUser>
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function AuthHandoffPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  useEffect(() => {
    const hash = window.location.hash.slice(1) // remove leading '#'
    if (!hash) {
      navigate('/login', { replace: true })
      return
    }

    const params = new URLSearchParams(hash)
    const at = params.get('at')
    const rt = params.get('rt')
    const uRaw = params.get('u')

    if (!at || !rt || !uRaw) {
      navigate('/login', { replace: true })
      return
    }

    try {
      const user = JSON.parse(decodeURIComponent(uRaw))
      setTokens(at, rt)
      setUser(user)
      // Clear the hash so tokens are not visible in URL history
      window.history.replaceState(null, '', '/dashboard')
      navigate('/dashboard', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }, [])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Вхід у систему…</p>
      </div>
    </div>
  )
}
