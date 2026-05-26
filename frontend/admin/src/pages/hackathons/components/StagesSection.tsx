import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { Plus, Trash2, Check, X, Pencil, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/utils/format'
import { useI18n } from '@/i18n'
import type { Stage, StageType } from '@/types/api.types'
import { clsx } from 'clsx'
import { inputCls } from './FormSection'

interface StagesSectionProps {
  hackathonId?: string
  stages?: Stage[]
  hackathonStart?: string
  hackathonEnd?: string
  mode?: 'edit' | 'create'
  onChange?: (stages: Array<{ name: string; type: StageType; startDate: string; endDate: string; orderIndex: number }>) => void
}

const STAGE_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-rose-500',
]

// ── Stage type options ─────────────────────────────────────────────────────
export function getStageTypeOptions(lang: string) {
  return [
    { value: 'REGISTRATION' as StageType, label: lang === 'uk' ? 'Реєстрація' : 'Registration', description: lang === 'uk' ? 'Команди реєструються та подають заявки' : 'Teams register and apply' },
    { value: 'HACKING' as StageType, label: lang === 'uk' ? 'Хакінг' : 'Hacking', description: lang === 'uk' ? 'Активна фаза розробки, подача проєктів' : 'Active coding phase, project submission' },
    { value: 'PRESENTATION' as StageType, label: lang === 'uk' ? 'Презентація' : 'Presentation', description: lang === 'uk' ? 'Команди представляють свої рішення' : 'Teams present their solutions' },
    { value: 'JUDGING' as StageType, label: lang === 'uk' ? 'Суддівство' : 'Judging', description: lang === 'uk' ? 'Судді оцінюють проєкти' : 'Judges evaluate projects' },
    { value: 'FINISHED' as StageType, label: lang === 'uk' ? 'Завершено' : 'Finished', description: lang === 'uk' ? 'Хакатон завершено, результати оголошено' : 'Hackathon completed, results announced' },
    { value: 'CUSTOM' as StageType, label: lang === 'uk' ? 'Кастомна' : 'Custom', description: lang === 'uk' ? 'Інша фаза — без спеціальних прав' : 'Other phase — no special rights' },
  ]
}

const STAGE_TYPE_COLORS: Record<StageType, string> = {
  REGISTRATION: 'bg-blue-100 text-blue-700 border-blue-200',
  HACKING:      'bg-violet-100 text-violet-700 border-violet-200',
  PRESENTATION: 'bg-amber-100 text-amber-700 border-amber-200',
  JUDGING:      'bg-orange-100 text-orange-700 border-orange-200',
  FINISHED:     'bg-green-100 text-green-700 border-green-200',
  CUSTOM:       'bg-gray-100 text-gray-600 border-gray-200',
}

const emptyForm = { name: '', type: 'CUSTOM' as StageType, startDate: '', endDate: '', orderIndex: '1', description: '' }

/** Convert UTC ISO string to datetime-local format in LOCAL time */
function toDatetimeLocal(iso?: string | Date | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type FormState = typeof emptyForm

// ── Stage form fields ─ declared OUTSIDE parent to prevent focus loss on re-render ──
function StageFormFields({ form, setForm, lang }: { form: FormState; setForm: (f: FormState) => void; lang: string }) {
  const options = getStageTypeOptions(lang)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {lang === 'uk' ? 'Назва *' : 'Name *'}
          </label>
          <input
            placeholder={lang === 'uk' ? 'напр. Перший хакінг' : 'e.g. First hacking'}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {lang === 'uk' ? 'Тип стадії *' : 'Stage type *'}
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as StageType })}
            className={inputCls}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.description}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {lang === 'uk' ? 'Порядок *' : 'Order *'}
          </label>
          <input
            type="number"
            placeholder="#"
            value={form.orderIndex}
            onChange={(e) => setForm({ ...form, orderIndex: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {lang === 'uk' ? 'Початок *' : 'Start *'}
          </label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {lang === 'uk' ? 'Завершення *' : 'End *'}
          </label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          {lang === 'uk' ? 'Завдання' : 'Task'}{' '}
          <span className="font-normal">
            {lang === 'uk'
              ? '(видно учасникам тільки під час активного етапу — не розкривайте наперед!)'
              : '(visible to participants only during the active phase — do not reveal beforehand!)'}
          </span>
        </label>
        <textarea
          rows={3}
          placeholder={
            lang === 'uk'
              ? 'Наприклад: Розробіть MVP та підготуйте демо. Подайте репозиторій до завершення етапу.'
              : 'e.g. Build an MVP and prepare a demo. Submit the repository before the phase ends.'
          }
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputCls + ' resize-none'}
        />
      </div>
    </div>
  )
}

export function StagesSection({ hackathonId, stages: initialStages = [], hackathonStart, hackathonEnd, mode = 'edit', onChange }: StagesSectionProps) {
  const qc = useQueryClient()
  const { lang } = useI18n()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  // Local state for create mode
  const [localStages, setLocalStages] = useState<Array<Stage & { id: string }>>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: stagesData } = useQuery({
    queryKey: ['stages', hackathonId],
    queryFn: () => hackathonsApi.listStages(hackathonId!),
    enabled: mode === 'edit' && !!hackathonId,
  })

  const stages = mode === 'edit' ? (stagesData?.data.data ?? initialStages) : localStages
  const sorted = [...stages].sort((a, b) => a.orderIndex - b.orderIndex)

  const createMut = useMutation({
    mutationFn: () =>
      hackathonsApi.createStage(hackathonId!, {
        name: form.name,
        type: form.type,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        orderIndex: Number(form.orderIndex),
        description: form.description.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(lang === 'uk' ? 'Стадію додано' : 'Stage added')
      qc.invalidateQueries({ queryKey: ['stages', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setAdding(false)
      setForm({ ...emptyForm, orderIndex: String(sorted.length + 2) })
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка при створенні стадії' : 'Error creating stage'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Stage> & { description?: string } }) =>
      hackathonsApi.updateStage(id, {
        name: data.name,
        type: data.type,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        orderIndex: data.orderIndex !== undefined ? Number(data.orderIndex) : undefined,
        description: (data as any).description?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(lang === 'uk' ? 'Стадію оновлено' : 'Stage updated')
      qc.invalidateQueries({ queryKey: ['stages', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setEditingId(null)
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка при оновленні стадії' : 'Error updating stage'),
  })

  const deleteMut = useMutation({
    mutationFn: (stageId: string) => hackathonsApi.deleteStage(stageId),
    onSuccess: () => {
      toast.success(lang === 'uk' ? 'Стадію видалено' : 'Stage deleted')
      qc.invalidateQueries({ queryKey: ['stages', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка при видаленні' : 'Error deleting stage'),
  })

  const notifyParent = (arr: Array<Stage & { id: string }>) => {
    onChange?.(arr.map(s => ({ name: s.name, type: s.type, startDate: s.startDate, endDate: s.endDate, orderIndex: s.orderIndex })))
  }

  // ── Date range validation ─────────────────────────────────────────────────
  const validateStageDates = (f: FormState): string | null => {
    if (!f.startDate || !f.endDate) return lang === 'uk' ? 'Дати початку та завершення обов\'язкові' : 'Start and end dates are required'
    const start = new Date(f.startDate).getTime()
    const end   = new Date(f.endDate).getTime()
    if (start >= end) return lang === 'uk' ? 'Дата початку має бути раніше дати завершення' : 'Start date must be before end date'
    if (hackathonStart) {
      const hStart = new Date(hackathonStart).getTime()
      if (start < hStart) return lang === 'uk' ? `Початок стадії раніше старту хакатону (${formatDate(hackathonStart)})` : `Stage start is before hackathon start (${formatDate(hackathonStart)})`
    }
    if (hackathonEnd) {
      const hEnd = new Date(hackathonEnd).getTime()
      if (end > hEnd) return lang === 'uk' ? `Завершення стадії пізніше кінця хакатону (${formatDate(hackathonEnd)})` : `Stage end is after hackathon end (${formatDate(hackathonEnd)})`
    }
    return null
  }

  const handleSaveAdd = () => {
    const err = validateStageDates(form)
    if (err) { setValidationError(err); return }
    setValidationError(null)
    if (mode === 'create') {
      const newStage = {
        id: Date.now().toString(),
        hackathonId: '',
        name: form.name,
        type: form.type,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        orderIndex: Number(form.orderIndex),
      } as Stage & { id: string }
      const newArr = [...localStages, newStage]
      setLocalStages(newArr)
      notifyParent(newArr)
      setAdding(false)
      setForm({ ...emptyForm, orderIndex: String(newArr.length + 1) })
    } else {
      createMut.mutate()
    }
  }

  const handleSaveEdit = (id: string) => {
    const err = validateStageDates(form)
    if (err) { setValidationError(err); return }
    setValidationError(null)
    if (mode === 'create') {
      const newArr = localStages.map(x =>
        x.id === id
          ? { ...x, name: form.name, type: form.type, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(), orderIndex: Number(form.orderIndex) }
          : x,
      )
      setLocalStages(newArr)
      notifyParent(newArr)
      setEditingId(null)
    } else {
      updateMut.mutate({ id, data: { name: form.name, type: form.type, startDate: form.startDate, endDate: form.endDate, orderIndex: Number(form.orderIndex), description: form.description } as any })
    }
  }

  const handleDelete = (id: string) => {
    if (mode === 'create') {
      const newArr = localStages.filter(x => x.id !== id)
      setLocalStages(newArr)
      notifyParent(newArr)
    } else {
      deleteMut.mutate(id)
    }
  }

  const handleCancel = () => {
    setAdding(false)
    setEditingId(null)
    setValidationError(null)
    setForm({ ...emptyForm, orderIndex: String(sorted.length + 1) })
  }

  // Build timeline — reactive to stages changes, recalculated whenever sorted changes
  const timeline = (() => {
    const first = sorted[0]
    const last = sorted[sorted.length - 1]

    const rangeStart = hackathonStart
      ? new Date(hackathonStart).getTime()
      : first ? new Date(first.startDate).getTime() : Date.now()

    const rangeEnd = hackathonEnd
      ? new Date(hackathonEnd).getTime()
      : last ? new Date(last.endDate).getTime() : Date.now() + 86400000

    const totalMs = Math.max(rangeEnd - rangeStart, 1)
    const nowMs = Date.now()

    const segments = sorted.map((stage, i) => {
      const start = new Date(stage.startDate).getTime()
      const end = new Date(stage.endDate).getTime()
      const left = Math.max(0, ((start - rangeStart) / totalMs) * 100)
      const width = Math.max(0.5, ((end - start) / totalMs) * 100)
      const isActive = nowMs >= start && nowMs <= end
      return { stage, i, left, width, isActive }
    })

    const nowPct = ((nowMs - rangeStart) / totalMs) * 100
    const showNow = nowMs >= rangeStart && nowMs <= rangeEnd

    return { segments, nowPct, showNow, rangeStart, rangeEnd }
  })()


  return (
    <div className="space-y-4">
      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          {lang === 'uk' ? 'Стадії ще не визначені.' : 'No stages defined yet.'}
        </p>
      )}

      {/* Stage list */}
      <div className="space-y-2">
        {sorted.map((stage, i) => {
          const start = new Date(stage.startDate).getTime()
          const end = new Date(stage.endDate).getTime()
          const nowMs = Date.now()
          const isActive = nowMs >= start && nowMs <= end
          const isPast = nowMs > end
          const options = getStageTypeOptions(lang)
          const typeOpt = options.find(o => o.value === stage.type)
          return (
            <div key={stage.id} className={clsx(
              'rounded-lg border px-4 py-3',
              isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-background',
            )}>
              {editingId === stage.id ? (
                <div className="space-y-3">
                  {(hackathonStart || hackathonEnd) && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5">
                      📅 {lang === 'uk' ? 'Допустимий діапазон хакатону: ' : 'Allowed hackathon range: '}{' '}
                      {hackathonStart && <strong>{formatDate(hackathonStart)}</strong>}{hackathonStart && hackathonEnd && ' — '}{hackathonEnd && <strong>{formatDate(hackathonEnd)}</strong>}
                    </p>
                  )}
                  <StageFormFields form={form} setForm={setForm} lang={lang} />
                  {validationError && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{validationError}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleSaveEdit(stage.id)}
                      disabled={!form.name || !form.startDate || !form.endDate || updateMut.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                      <Check className="h-3.5 w-3.5" /> {lang === 'uk' ? 'Зберегти' : 'Save'}
                    </button>
                    <button type="button" onClick={handleCancel}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
                      <X className="h-3.5 w-3.5" /> {lang === 'uk' ? 'Скасувати' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={clsx('h-2.5 w-2.5 rounded-full', STAGE_COLORS[i % STAGE_COLORS.length])} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={clsx('text-sm font-medium', isPast && 'text-muted-foreground line-through')}>
                          {stage.name}
                        </p>
                        {isActive && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary font-normal">
                            {lang === 'uk' ? 'Зараз' : 'Now'}
                          </span>
                        )}
                        {/* Type badge */}
                        <span className={clsx(
                          'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          STAGE_TYPE_COLORS[stage.type ?? 'CUSTOM'],
                        )}>
                          {typeOpt?.label ?? stage.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(stage.startDate)} — {formatDate(stage.endDate)}
                      </p>
                      {(stage as any).description && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 max-w-xs truncate">
                          {(stage as any).description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-md p-1 hover:bg-accent transition-colors"
                        onClick={() => {
                          setEditingId(stage.id)
                          setAdding(false)
                          setForm({
                            name: stage.name,
                            type: stage.type ?? 'CUSTOM',
                            startDate: toDatetimeLocal(stage.startDate),
                            endDate: toDatetimeLocal(stage.endDate),
                            orderIndex: String(stage.orderIndex),
                            description: (stage as any).description ?? '',
                          })
                        }}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-1 hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDelete(stage.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">#{stage.orderIndex}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Visual timeline bar */}
      {sorted.length > 0 && (
        <div className="mt-4 space-y-1">
          {/* Date range labels */}
          <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
            <span>{formatDate(new Date(timeline.rangeStart).toISOString())}</span>
            <span>{formatDate(new Date(timeline.rangeEnd).toISOString())}</span>
          </div>

          {/* Bar */}
          <div className="relative h-7 rounded-lg bg-muted overflow-hidden">
            {timeline.segments.map(({ stage, i, left, width, isActive }) => (
              <div
                key={stage.id}
                title={`${stage.name}: ${formatDate(stage.startDate)} — ${formatDate(stage.endDate)}`}
                className={clsx(
                  'absolute top-0 h-full flex items-center justify-center text-[10px] font-semibold text-white overflow-hidden transition-all',
                  STAGE_COLORS[i % STAGE_COLORS.length],
                  isActive && 'ring-2 ring-white ring-inset',
                )}
                style={{ left: `${left}%`, width: `${width}%`, paddingLeft: 1, paddingRight: 1 }}
              >
                {width > 6 && (
                  <span className="truncate px-1 drop-shadow-sm">{stage.name}</span>
                )}
              </div>
            ))}

            {/* Today marker */}
            {timeline.showNow && (
              <div
                className="absolute top-0 h-full w-0.5 bg-white/90 z-10 shadow-sm"
                style={{ left: `${timeline.nowPct}%` }}
              >
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </div>

          {/* Stage name labels below bar */}
          <div className="relative h-5">
            {timeline.segments.map(({ stage, i, left, width }) => (
              <div
                key={stage.id}
                className={clsx(
                  'absolute text-[9px] font-medium truncate text-center',
                  STAGE_COLORS[i % STAGE_COLORS.length].replace('bg-', 'text-').replace('-500', '-700'),
                )}
                style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
              >
                {stage.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {adding ? (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4 mt-4">
          {(hackathonStart || hackathonEnd) && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5">
              📅 {lang === 'uk' ? 'Стадія має бути в межах хакатону: ' : 'Stage must be within the hackathon range: '}{' '}
              {hackathonStart && <strong>{formatDate(hackathonStart)}</strong>}{hackathonStart && hackathonEnd && ' — '}{hackathonEnd && <strong>{formatDate(hackathonEnd)}</strong>}
            </p>
          )}
          <StageFormFields form={form} setForm={setForm} lang={lang} />
          {validationError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveAdd}
              disabled={!form.name || !form.startDate || !form.endDate || createMut.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              <Check className="h-3.5 w-3.5" /> {lang === 'uk' ? 'Зберегти' : 'Save'}
            </button>
            <button type="button" onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
              <X className="h-3.5 w-3.5" /> {lang === 'uk' ? 'Скасувати' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : !editingId && (
        <button type="button" onClick={() => {
          setAdding(true)
          setEditingId(null)
          setForm({ ...emptyForm, orderIndex: String(sorted.length + 2) })
        }}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full mt-4">
          <Plus className="h-4 w-4" /> {lang === 'uk' ? 'Додати стадію' : 'Add stage'}
        </button>
      )}
    </div>
  )
}
