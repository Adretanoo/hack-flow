import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth.store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Ім\'я має містити мінімум 2 символи'),
  email: z.string().email('Невірний формат email'),
  password: z.string().min(8, 'Пароль має містити мінімум 8 символів'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true)
      setError('')
      const { confirmPassword, ...payload } = data
      const response = await authApi.register(payload)
      const { accessToken, refreshToken, user } = response.data.data
      setTokens(accessToken, refreshToken)
      setUser(user)
      navigate('/app')
    } catch (err: any) {
      setError(err.message || 'Помилка реєстрації')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Створення акаунту</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Або <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">увійдіть, якщо вже маєте акаунт</Link>
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
              <label className="block text-sm font-medium leading-6 text-foreground">ПІБ</label>
              <div className="mt-2">
                <input
                  {...register('fullName')}
                  type="text"
                  className="block w-full rounded-md border-0 py-2 text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3 bg-background"
                />
                {errors.fullName && <p className="mt-1 text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium leading-6 text-foreground">Email адреса</label>
              <div className="mt-2">
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full rounded-md border-0 py-2 text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3 bg-background"
                />
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium leading-6 text-foreground">Пароль</label>
              <div className="mt-2">
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full rounded-md border-0 py-2 text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3 bg-background"
                />
                {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium leading-6 text-foreground">Підтвердження паролю</label>
              <div className="mt-2">
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="block w-full rounded-md border-0 py-2 text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3 bg-background"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold leading-6 text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Зареєструватись'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
