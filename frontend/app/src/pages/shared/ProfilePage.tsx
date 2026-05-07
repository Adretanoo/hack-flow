import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { mentorshipApi } from '@/api/mentorship'
import { useAuthStore } from '@/store/auth.store'
import { Avatar } from '@/components/shared/Avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [successMsg, setSuccessMsg] = useState('')

  const isMentor = user?.role === 'mentor' || user?.role === 'admin'
  const { data: availabilitiesData } = useQuery({
    queryKey: ['my-availabilities'],
    queryFn: () => mentorshipApi.getMyAvailabilities().then(res => res.data.data),
    enabled: isMentor
  })

  // Extract unique track names
  const expertiseTracks = Array.from(new Set(
    (availabilitiesData || [])
      .map((a: any) => a.track?.name)
      .filter(Boolean)
  )) as string[]

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      description: user?.description || user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
      isLookingForTeam: user?.isLookingForTeam || false,
    }
  })

  useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName)
      setValue('description', user.description || user.bio || '')
      setValue('avatarUrl', user.avatarUrl || '')
      setValue('isLookingForTeam', user.isLookingForTeam || false)
    }
  }, [user, setValue])

  const updateMut = useMutation({
    mutationFn: (data: any) => usersApi.updateMe(data),
    onSuccess: (res) => {
      setUser(res.data.data)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setSuccessMsg('Профіль успішно оновлено')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  })

  const onSubmit = (data: any) => {
    const payload = { ...data }
    if (!payload.avatarUrl) payload.avatarUrl = null
    if (!payload.description) payload.description = null
    updateMut.mutate(payload)
  }

  if (!user) return <div className="py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Мій профіль</h1>
        <p className="mt-2 text-muted-foreground">Керуйте своїми особистими даними та налаштуваннями.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="flex items-center gap-6">
            <Avatar name={user.fullName} url={watch('avatarUrl')} size="xl" />
            <div className="space-y-1">
              <h3 className="font-medium">Аватар</h3>
              <input 
                {...register('avatarUrl')} 
                type="text" 
                placeholder="URL зображення" 
                className="w-full sm:w-80 rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-background"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">ПІБ</label>
              <input 
                {...register('fullName')} 
                type="text" 
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email (не змінюється)</label>
              <input 
                type="email" 
                value={user.email} 
                disabled 
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Про себе</label>
            <textarea 
              {...register('description')} 
              rows={4}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-background resize-none"
              placeholder="Розкажіть трохи про свій досвід..."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/50">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Шукаю команду</label>
              <p className="text-xs text-muted-foreground">Ваш профіль буде видно іншим учасникам, які шукають людей у команду</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" {...register('isLookingForTeam')} className="peer sr-only" />
              <div className="peer h-6 w-11 rounded-full bg-border after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
            {successMsg && <span className="text-sm font-medium text-green-600">{successMsg}</span>}
            <button 
              type="submit" 
              disabled={updateMut.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {updateMut.isPending ? <LoadingSpinner size="sm" /> : 'Зберегти зміни'}
            </button>
          </div>
        </form>
      </div>

      {isMentor && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Моя експертиза</h3>
          <p className="text-sm text-muted-foreground mb-4">На основі ваших доступностей для менторства, ви спеціалізуєтесь на наступних треках:</p>
          
          {expertiseTracks.length === 0 ? (
            <div className="p-4 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground text-center">
              Ви ще не додали жодного специфічного треку до свого розкладу.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {expertiseTracks.map(track => (
                <span key={track} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium">
                  {track}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
