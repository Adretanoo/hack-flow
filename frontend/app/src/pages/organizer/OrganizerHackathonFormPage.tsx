import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizerApi, type CreateHackathonDto } from '@/api/organizer'
import { ArrowLeft, Save, Loader2, Plus, Trash2, AlertCircle, Trophy } from 'lucide-react'
import { toast } from 'sonner'

const STAGE_TYPES = ['REGISTRATION', 'HACKING', 'JUDGING', 'REVIEW', 'FINISHED']

export function OrganizerHackathonFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id

  const { data: existing } = useQuery({
    queryKey: ['organizer-hackathon', id],
    queryFn: () => organizerApi.getById(id!),
    enabled: isEdit,
  })

  const h = existing?.data.data as any

  const [form, setForm] = useState<CreateHackathonDto>({
    title: '',
    subtitle: '',
    description: '',
    location: '',
    online: true,
    startDate: '',
    endDate: '',
    minTeamSize: 2,
    maxTeamSize: 5,
    contactEmail: '',
    tags: [],
    tracks: [],
    stages: [],
    awards: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-fill on edit mode
  useEffect(() => {
    if (h) {
      setForm({
        title: h.title ?? '',
        subtitle: h.subtitle ?? '',
        description: h.description ?? '',
        location: h.location ?? '',
        online: h.online ?? true,
        startDate: h.startDate?.slice(0, 10) ?? '',
        endDate: h.endDate?.slice(0, 10) ?? '',
        minTeamSize: h.minTeamSize ?? 2,
        maxTeamSize: h.maxTeamSize ?? 5,
        contactEmail: h.contactEmail ?? '',
        tags: h.tags?.map((t: any) => t.tag?.name ?? t) ?? [],
        tracks: h.tracks?.map((t: any) => ({ name: t.name, description: t.description ?? '', guidelines: t.guidelines ?? '' })) ?? [],
        stages: h.stages?.map((s: any) => ({
          name: s.name,
          startDate: s.startDate?.slice(0, 10) ?? '',
          endDate: s.endDate?.slice(0, 10) ?? '',
          orderIndex: s.orderIndex ?? 0,
          type: s.type ?? 'REGISTRATION',
        })) ?? [],
        awards: h.awards?.map((a: any) => ({ name: a.name, description: a.description ?? '', place: a.place ?? 1 })) ?? [],
      })
    }
  }, [h])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = "Назва обов'язкова"
    if (!form.startDate) e.startDate = "Дата початку обов'язкова"
    if (!form.endDate) e.endDate = "Дата завершення обов'язкова"
    if (form.startDate && form.endDate && form.startDate >= form.endDate) e.endDate = 'Дата завершення має бути після початку'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const createMut = useMutation({
    mutationFn: (data: CreateHackathonDto) => organizerApi.create(data),
    onSuccess: (res) => {
      toast.success('Хакатон створено!')
      qc.invalidateQueries({ queryKey: ['organizer-hackathons'] })
      navigate(`/app/organizer/hackathons/${(res as any).data.data.id}`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Помилка створення'),
  })

  const updateMut = useMutation({
    mutationFn: (data: Partial<CreateHackathonDto>) => organizerApi.update(id!, data),
    onSuccess: () => {
      toast.success('Хакатон оновлено!')
      qc.invalidateQueries({ queryKey: ['organizer-hackathons'] })
      qc.invalidateQueries({ queryKey: ['organizer-hackathon', id] })
      navigate(`/app/organizer/hackathons/${id}`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Помилка оновлення'),
  })

  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = () => {
    if (!validate()) return
    const payload = {
      ...form,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      stages: form.stages?.map((s, i) => ({
        ...s,
        startDate: new Date(s.startDate).toISOString(),
        endDate: new Date(s.endDate).toISOString(),
        orderIndex: i,
      })),
    }
    if (isEdit) {
      updateMut.mutate(payload)
    } else {
      createMut.mutate(payload as CreateHackathonDto)
    }
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags?.includes(t)) {
      setForm(f => ({ ...f, tags: [...(f.tags ?? []), t] }))
    }
    setTagInput('')
  }

  const addTrack = () => setForm(f => ({ ...f, tracks: [...(f.tracks ?? []), { name: '', description: '' }] }))
  const addStage = () => setForm(f => ({
    ...f, stages: [...(f.stages ?? []), { name: '', startDate: '', endDate: '', orderIndex: f.stages?.length ?? 0, type: 'REGISTRATION' }]
  }))
  const addAward = () => setForm(f => ({ ...f, awards: [...(f.awards ?? []), { name: '', place: (f.awards?.length ?? 0) + 1, description: '' }] }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(isEdit ? `/app/organizer/hackathons/${id}` : '/app/organizer/hackathons')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Редагування хакатону' : 'Новий хакатон'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit ? 'Оновіть інформацію про хакатон' : 'Заповніть форму щоб створити новий хакатон'}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPending ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>
      </div>

      {/* General info */}
      <Section title="Основна інформація" icon={<Trophy className="h-4 w-4 text-orange-500" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Назва хакатону *" error={errors.title}>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Наприклад: HackUA 2025"
              className={input(errors.title)}
            />
          </Field>
          <Field label="Підзаголовок">
            <input
              value={form.subtitle ?? ''}
              onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
              placeholder="Короткий опис"
              className={input()}
            />
          </Field>
        </div>
        <Field label="Опис">
          <textarea
            value={form.description ?? ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={4}
            placeholder="Детальний опис хакатону..."
            className={input() + ' resize-none'}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email для зв'язку">
            <input
              type="email"
              value={form.contactEmail ?? ''}
              onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
              placeholder="organizer@example.com"
              className={input()}
            />
          </Field>
          <Field label="Локація">
            <input
              value={form.location ?? ''}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Онлайн / Київ"
              className={input()}
            />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="online"
            checked={form.online ?? true}
            onChange={e => setForm(f => ({ ...f, online: e.target.checked }))}
            className="h-4 w-4 rounded accent-orange-500"
          />
          <label htmlFor="online" className="text-sm font-medium">Онлайн формат</label>
        </div>
      </Section>

      {/* Dates & Team size */}
      <Section title="Дати та команди">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Дата початку *" error={errors.startDate}>
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={input(errors.startDate)} />
          </Field>
          <Field label="Дата завершення *" error={errors.endDate}>
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={input(errors.endDate)} />
          </Field>
          <Field label="Мін. учасників у команді">
            <input type="number" min={1} max={20} value={form.minTeamSize} onChange={e => setForm(f => ({ ...f, minTeamSize: +e.target.value }))} className={input()} />
          </Field>
          <Field label="Макс. учасників у команді">
            <input type="number" min={1} max={20} value={form.maxTeamSize} onChange={e => setForm(f => ({ ...f, maxTeamSize: +e.target.value }))} className={input()} />
          </Field>
        </div>
      </Section>

      {/* Tags */}
      <Section title="Теги">
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
            placeholder="Введіть тег та натисніть Enter"
            className={input() + ' flex-1'}
          />
          <button onClick={addTag} className="rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-100 transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {(form.tags ?? []).map(tag => (
            <span key={tag} className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
              {tag}
              <button onClick={() => setForm(f => ({ ...f, tags: f.tags?.filter(t => t !== tag) }))} className="hover:text-orange-900">×</button>
            </span>
          ))}
        </div>
      </Section>

      {/* Tracks */}
      <Section title="Треки" action={<AddBtn onClick={addTrack} />}>
        {(form.tracks ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Треків немає. Натисніть «+» щоб додати.</p>
        ) : (form.tracks ?? []).map((t, i) => (
          <div key={i} className="relative rounded-xl border border-border bg-background p-4">
            <button
              onClick={() => setForm(f => ({ ...f, tracks: f.tracks?.filter((_, j) => j !== i) }))}
              className="absolute right-3 top-3 p-1 rounded hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="grid gap-3 sm:grid-cols-2 pr-8">
              <Field label={`Назва треку ${i + 1} *`}>
                <input
                  value={t.name}
                  onChange={e => setForm(f => ({ ...f, tracks: f.tracks?.map((tr, j) => j === i ? { ...tr, name: e.target.value } : tr) }))}
                  placeholder="Frontend, Backend, AI..."
                  className={input()}
                />
              </Field>
              <Field label="Опис">
                <input
                  value={t.description ?? ''}
                  onChange={e => setForm(f => ({ ...f, tracks: f.tracks?.map((tr, j) => j === i ? { ...tr, description: e.target.value } : tr) }))}
                  placeholder="Короткий опис треку"
                  className={input()}
                />
              </Field>
            </div>
          </div>
        ))}
      </Section>

      {/* Stages */}
      <Section title="Стадії" action={<AddBtn onClick={addStage} />}>
        {(form.stages ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Стадій немає. Натисніть «+» щоб додати.</p>
        ) : (form.stages ?? []).map((s, i) => (
          <div key={i} className="relative rounded-xl border border-border bg-background p-4">
            <button
              onClick={() => setForm(f => ({ ...f, stages: f.stages?.filter((_, j) => j !== i) }))}
              className="absolute right-3 top-3 p-1 rounded hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="grid gap-3 sm:grid-cols-2 pr-8">
              <Field label={`Назва стадії ${i + 1}`}>
                <input
                  value={s.name}
                  onChange={e => setForm(f => ({ ...f, stages: f.stages?.map((st, j) => j === i ? { ...st, name: e.target.value } : st) }))}
                  placeholder="Реєстрація, Хакінг..."
                  className={input()}
                />
              </Field>
              <Field label="Тип">
                <select
                  value={s.type ?? 'REGISTRATION'}
                  onChange={e => setForm(f => ({ ...f, stages: f.stages?.map((st, j) => j === i ? { ...st, type: e.target.value } : st) }))}
                  className={input()}
                >
                  {STAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Початок">
                <input type="date" value={s.startDate?.slice(0, 10)} onChange={e => setForm(f => ({ ...f, stages: f.stages?.map((st, j) => j === i ? { ...st, startDate: e.target.value } : st) }))} className={input()} />
              </Field>
              <Field label="Кінець">
                <input type="date" value={s.endDate?.slice(0, 10)} onChange={e => setForm(f => ({ ...f, stages: f.stages?.map((st, j) => j === i ? { ...st, endDate: e.target.value } : st) }))} className={input()} />
              </Field>
            </div>
          </div>
        ))}
      </Section>

      {/* Awards */}
      <Section title="Нагороди" action={<AddBtn onClick={addAward} />}>
        {(form.awards ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Нагород немає. Натисніть «+» щоб додати.</p>
        ) : (form.awards ?? []).map((a, i) => (
          <div key={i} className="relative rounded-xl border border-border bg-background p-4">
            <button
              onClick={() => setForm(f => ({ ...f, awards: f.awards?.filter((_, j) => j !== i) }))}
              className="absolute right-3 top-3 p-1 rounded hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="grid gap-3 sm:grid-cols-2 pr-8">
              <Field label={`Назва нагороди ${i + 1}`}>
                <input
                  value={a.name}
                  onChange={e => setForm(f => ({ ...f, awards: f.awards?.map((aw, j) => j === i ? { ...aw, name: e.target.value } : aw) }))}
                  placeholder="Гран-прі, 1 місце..."
                  className={input()}
                />
              </Field>
              <Field label="Місце">
                <input
                  type="number"
                  min={1}
                  value={a.place}
                  onChange={e => setForm(f => ({ ...f, awards: f.awards?.map((aw, j) => j === i ? { ...aw, place: +e.target.value } : aw) }))}
                  className={input()}
                />
              </Field>
              <Field label="Опис" className="col-span-2">
                <input
                  value={a.description ?? ''}
                  onChange={e => setForm(f => ({ ...f, awards: f.awards?.map((aw, j) => j === i ? { ...aw, description: e.target.value } : aw) }))}
                  placeholder="Опис нагороди..."
                  className={input()}
                />
              </Field>
            </div>
          </div>
        ))}
      </Section>

      {/* Bottom save */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors shadow-sm"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? 'Оновити хакатон' : 'Створити хакатон'}
        </button>
      </div>
    </div>
  )
}

// ── Helper sub-components ──────────────────────────────────────────────────────

function Section({ title, children, icon, action }: { title: string; children: React.ReactNode; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-base">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children, error, className = '' }: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  )
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-100 transition-colors"
    >
      <Plus className="h-4 w-4" /> Додати
    </button>
  )
}

const input = (err?: string) =>
  `w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${
    err
      ? 'border-destructive bg-destructive/5 focus:ring-2 focus:ring-destructive/20'
      : 'border-input bg-background focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20'
  }`
