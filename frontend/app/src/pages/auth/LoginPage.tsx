import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth.store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useI18n } from '@/i18n'

// Схема визначена ПОЗА компонентом, щоб не перестворюватись при кожному рендері
// (інакше react-hook-form скидає форму при кожній зміні стану)
const loginSchema = z.object({
  email: z.string().email('Невірний email'),
  password: z.string().min(1, 'Введіть пароль'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useI18n()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true)
      setError('')
      const response = await authApi.login(data)
      const { accessToken, refreshToken, user } = response.data.data

      // Admin та organizer → адмін-панель (localhost:5173)
      // Токени передаємо через URL hash щоб уникнути повторного логіну
      if (user.role === 'admin' || user.role === 'organizer') {
        setTokens(accessToken, refreshToken)
        setUser(user)
        const userEncoded = encodeURIComponent(JSON.stringify({
          id: user.id, email: user.email,
          fullName: user.fullName, username: user.username,
          role: user.role
        }))
        window.location.href =
          `http://localhost:5173/auth-handoff#at=${accessToken}&rt=${refreshToken}&u=${userEncoded}`
        return
      }

      setTokens(accessToken, refreshToken)
      setUser(user)

      const pendingToken = sessionStorage.getItem('hackflow_pending_join_token')
      if (pendingToken) {
        navigate(`/join/${pendingToken}`)
      } else {
        navigate('/app')
      }
    } catch (err: any) {
      // Перекладаємо відомі повідомлення бекенду на українську
      const raw: string = err?.response?.data?.message || err?.message || ''
      const translated =
        raw.toLowerCase().includes('invalid credentials') || raw.toLowerCase().includes('invalid email')
          ? 'Невірний email або пароль'
          : raw.toLowerCase().includes('deactivated')
          ? 'Акаунт деактивовано'
          : raw || t.auth.loginError
      setError(translated)
    } finally {
      setIsLoading(false)
    }
  }

  const inputCls = 'block w-full rounded-md border-0 py-2 text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3 bg-background'

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t.auth.loginTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.auth.orCreateAccount}{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
              {t.auth.loginSubtitle}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive font-medium text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium leading-6 text-foreground">{t.auth.emailLabel}</label>
              <div className="mt-2">
                <input {...register('email')} type="email" placeholder={t.auth.emailPlaceholder} className={inputCls} />
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-foreground">{t.auth.passwordLabel}</label>
              <div className="mt-2">
                <input {...register('password')} type="password" className={inputCls} />
                {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold leading-6 text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : t.auth.loginBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
