import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { FormSection, Field, inputCls, textareaCls } from './components/FormSection'
import { TracksSection } from './components/TracksSection'
import { TagsSection } from './components/TagsSection'
import { StagesSection } from './components/StagesSection'
import { AwardsSection } from './components/AwardsSection'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { toast } from 'sonner'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'

const schema = z.object({
  title: z.string().min(3, 'Мінімум 3 символи'),
  subtitle: z.string().optional(),
  description: z.string().min(50, 'Мінімум 50 символів').optional().or(z.literal('')),
  location: z.string().optional(),
  online: z.boolean(),
  contactEmail: z.string().email('Невірний email').optional().or(z.literal('')),
  banner: z.string().url('Невірний URL').optional().or(z.literal('')),
  rulesUrl: z.string().url('Невірний URL').optional().or(z.literal('')),
  startDate: z.string().min(1, 'Обов\'язкове поле'),
  endDate: z.string().min(1, 'Обов\'язкове поле'),
  minTeamSize: z.number().min(1).max(10),
  maxTeamSize: z.number().min(1).max(20),
}).refine((d) => !d.endDate || !d.startDate || d.endDate >= d.startDate, {
  message: 'Дата завершення має бути після початку',
  path: ['endDate'],
})

type FormData = z.infer<typeof schema>

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

import { usePageTitle } from '@/hooks/usePageTitle'

export function HackathonFormPage() {
  usePageTitle('Форма хакатону')
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: hackData, isLoading } = useQuery({
    queryKey: ['hackathon', id],
    queryFn: () => hackathonsApi.getById(id!),
    enabled: isEdit,
  })

  const hackathon = hackData?.data.data

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { online: false, minTeamSize: 1, maxTeamSize: 5 },
  })

  // Local state for creation mode nested arrays
  const [localTags, setLocalTags] = useState<string[]>([])
  const [localTracks, setLocalTracks] = useState<Array<{ name: string; description?: string }>>([])
  const [localStages, setLocalStages] = useState<Array<{ name: string; startDate: string; endDate: string; orderIndex: number }>>([])
  const [localAwards, setLocalAwards] = useState<Array<{ name: string; description?: string; certificate?: string; place: number }>>([])

  useEffect(() => {
    if (hackathon) {
      reset({
        title: hackathon.title,
        subtitle: hackathon.subtitle ?? '',
        description: hackathon.description ?? '',
        location: hackathon.location ?? '',
        online: hackathon.online,
        contactEmail: hackathon.contactEmail ?? '',
        banner: hackathon.banner ?? '',
        rulesUrl: hackathon.rulesUrl ?? '',
        startDate: toDatetimeLocal(hackathon.startDate),
        endDate: toDatetimeLocal(hackathon.endDate),
        minTeamSize: hackathon.minTeamSize,
        maxTeamSize: hackathon.maxTeamSize,
      })
    }
  }, [hackathon, reset])

  const createMut = useMutation({
    mutationFn: (data: FormData) => hackathonsApi.create({
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      description: data.description || undefined,
      contactEmail: data.contactEmail || undefined,
      banner: data.banner || undefined,
      rulesUrl: data.rulesUrl || undefined,
      location: data.location || undefined,
      tags: localTags.length > 0 ? localTags : undefined,
      tracks: localTracks.length > 0 ? localTracks : undefined,
      stages: localStages.length > 0 ? localStages.map((s: any) => ({ ...s, startDate: new Date(s.startDate).toISOString(), endDate: new Date(s.endDate).toISOString() })) : undefined,
      awards: localAwards.length > 0 ? localAwards : undefined,
    }),
    onSuccess: (res) => {
      toast.success('Хакатон створено!')
      qc.invalidateQueries({ queryKey: ['hackathons'] })
      navigate(`/hackathons/${res.data.data.id}/edit`)
    },
    onError: () => toast.error('Помилка при створенні'),
  })

  const updateMut = useMutation({
    mutationFn: (data: FormData) => hackathonsApi.update(id!, {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      description: data.description || undefined,
      contactEmail: data.contactEmail || undefined,
      banner: data.banner || undefined,
      rulesUrl: data.rulesUrl || undefined,
      location: data.location || undefined,
    }),
    onSuccess: () => {
      toast.success('Зміни збережено')
      qc.invalidateQueries({ queryKey: ['hackathon', id] })
      qc.invalidateQueries({ queryKey: ['hackathons'] })
    },
    onError: () => toast.error('Помилка при збереженні'),
  })

  const onSubmit = (data: FormData) => {
    if (isEdit) updateMut.mutate(data)
    else createMut.mutate(data)
  }

  const online = watch('online')
  const banner = watch('banner')
  const isPending = createMut.isPending || updateMut.isPending

  if (isEdit && isLoading) return <LoadingSpinner className="py-20" label="Завантаження…" />

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/hackathons')}
          className="rounded-lg border border-border p-2 hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{isEdit ? 'Редагування хакатону' : 'Новий хакатон'}</h2>
          {hackathon && <p className="text-sm text-muted-foreground">{hackathon.title}</p>}
        </div>
        <button type="submit" form="hackathon-form" disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? 'Зберегти' : 'Створити'}
        </button>
      </div>

      <form id="hackathon-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Section 1 */}
        <FormSection title="Основна інформація">
          <Field label="Назва *" error={errors.title?.message}>
            <input {...register('title')} placeholder="Назва хакатону" className={inputCls} />
          </Field>
          <Field label="Підзаголовок" error={errors.subtitle?.message}>
            <input {...register('subtitle')} placeholder="Короткий опис" className={inputCls} />
          </Field>
          <Field label="Опис" error={errors.description?.message}>
            <textarea {...register('description')} rows={4} placeholder="Детальний опис (мін. 50 символів)" className={textareaCls} />
          </Field>
          <Field label="Онлайн-подія">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" {...register('online')} className="h-4 w-4 accent-primary" />
              <span className="text-sm">Проводиться онлайн</span>
            </label>
          </Field>
          {!online && (
            <Field label="Локація" error={errors.location?.message}>
              <input {...register('location')} placeholder="Місто, адреса" className={inputCls} />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email для контакту" error={errors.contactEmail?.message}>
              <input {...register('contactEmail')} type="email" placeholder="contact@example.com" className={inputCls} />
            </Field>
            <Field label="URL правил" error={errors.rulesUrl?.message}>
              <input {...register('rulesUrl')} placeholder="https://…" className={inputCls} />
            </Field>
          </div>
          <Field label="URL банера" error={errors.banner?.message}>
            <input {...register('banner')} placeholder="https://…" className={inputCls} />
          </Field>
          {banner && banner.startsWith('http') && (
            <img src={banner} alt="Banner preview" className="max-h-40 rounded-lg object-cover border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
        </FormSection>

        {/* Section 2 */}
        <FormSection title="Дати та команди">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Початок *" error={errors.startDate?.message}>
              <input {...register('startDate')} type="datetime-local" className={inputCls} />
            </Field>
            <Field label="Завершення *" error={errors.endDate?.message}>
              <input {...register('endDate')} type="datetime-local" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Мін. розмір команди" error={errors.minTeamSize?.message}>
              <input {...register('minTeamSize', { valueAsNumber: true })} type="number" min={1} max={10} className={inputCls} />
            </Field>
            <Field label="Макс. розмір команди" error={errors.maxTeamSize?.message}>
              <input {...register('maxTeamSize', { valueAsNumber: true })} type="number" min={1} max={20} className={inputCls} />
            </Field>
          </div>
        </FormSection>

        {/* Sections 3-6 available in both modes */}
        <FormSection title="Теги" defaultOpen={false}>
          <TagsSection hackathonId={hackathon?.id} selectedTags={isEdit ? (hackathon?.tags ?? []) : (localTags.map((t: string) => ({ id: t, name: t })) as any)} mode={isEdit ? 'edit' : 'create'} onChange={setLocalTags} />
        </FormSection>
        <FormSection title="Треки" defaultOpen={false}>
          <TracksSection hackathonId={hackathon?.id} tracks={isEdit ? hackathon?.tracks : (localTracks as any)} mode={isEdit ? 'edit' : 'create'} onChange={setLocalTracks} />
        </FormSection>
        <FormSection title="Стадії" defaultOpen={false}>
          <StagesSection hackathonId={hackathon?.id} stages={isEdit ? hackathon?.stages : (localStages as any)} hackathonStart={watch('startDate')} hackathonEnd={watch('endDate')} mode={isEdit ? 'edit' : 'create'} onChange={setLocalStages as any} />
        </FormSection>
        <FormSection title="Нагороди" defaultOpen={false}>
          <AwardsSection hackathonId={hackathon?.id} awards={isEdit ? (hackathon as any)?.awards : (localAwards as any)} mode={isEdit ? 'edit' : 'create'} onChange={setLocalAwards as any} />
        </FormSection>
      </form>
    </div>
  )
}
