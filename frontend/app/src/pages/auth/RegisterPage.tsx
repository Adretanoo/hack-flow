import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth.store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useI18n } from '@/i18n'

const inputCls = 'block w-full rounded-md border-0 py-2 text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3 bg-background'

// Схема визначена ПОЗА компонентом — форма не скидається при кожному рендері
const registerSchema = z.object({
  fullName: z.string().min(2, 'Ім’я занадто коротке'),
  username: z
    .string()
    .min(3, 'Усернейм занадто короткий')
    .max(30, 'Усернейм занадто довгий')
    .regex(/^[a-z0-9_]+$/i, 'Тільки латинські літери, цифри та _'),
  email: z.string().email('Невірна email адреса'),
  password: z.string().min(8, 'Пароль мінімум 8 символів'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Паролі не збігаються',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useI18n()

  const { register, handleSubmit, setError: setFieldError, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true)
      setError('')
      const { confirmPassword, ...payload } = data
      void confirmPassword
      const response = await authApi.register(payload)
      const { accessToken, refreshToken, user } = response.data.data
      setTokens(accessToken, refreshToken)
      setUser(user)
      navigate('/app')
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t.auth.registerError

      if (msg.toLowerCase().includes('email')) {
        setFieldError('email', { message: t.auth.emailTaken })
      } else if (msg.toLowerCase().includes('username')) {
        setFieldError('username', { message: t.auth.usernameTaken })
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t.auth.registerTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.auth.orCreateAccount}{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
              {t.auth.registerSubtitle}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive font-medium text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium leading-6 text-foreground">{t.auth.fullNameLabel}</label>
            <div className="mt-1.5">
              <input {...register('fullName')} type="text" placeholder={t.auth.fullNamePlaceholder} className={inputCls} />
              {errors.fullName && <p className="mt-1 text-sm text-destructive">{errors.fullName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-foreground">
              {t.auth.usernameLabel} <span className="text-xs text-muted-foreground font-normal">{t.auth.usernameHint}</span>
            </label>
            <div className="mt-1.5 relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">@</span>
              <input
                {...register('username')}
                type="text"
                placeholder="ivan_petrenko"
                autoCapitalize="none"
                autoCorrect="off"
                className={inputCls + ' pl-7'}
              />
              {errors.username && <p className="mt-1 text-sm text-destructive">{errors.username.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-foreground">{t.auth.emailLabel}</label>
            <div className="mt-1.5">
              <input {...register('email')} type="email" placeholder={t.auth.emailPlaceholder} className={inputCls} />
              {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-foreground">{t.auth.passwordLabel}</label>
            <div className="mt-1.5">
              <input {...register('password')} type="password" placeholder={t.auth.passwordPlaceholder} className={inputCls} />
              {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-foreground">{t.auth.confirmPasswordLabel}</label>
            <div className="mt-1.5">
              <input {...register('confirmPassword')} type="password" placeholder={t.auth.confirmPasswordPlaceholder} className={inputCls} />
              {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold leading-6 text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : t.auth.registerBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
