import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { Plus, Trash2, Check, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/utils/format'
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
export const STAGE_TYPE_OPTIONS: { value: StageType; label: string; description: string }[] = [
  { value: 'REGISTRATION', label: 'Реєстрація', description: 'Команди реєструються та подають заявки' },
  { value: 'HACKING', label: 'Хакінг', description: 'Активна фаза розробки, подача проєктів' },
  { value: 'PRESENTATION', label: 'Презентація', description: 'Команди представляють свої рішення' },
  { value: 'JUDGING', label: 'Суддівство', description: 'Судді оцінюють проєкти' },
  { value: 'FINISHED', label: 'Завершено', description: 'Хакатон завершено, результати оголошено' },
  { value: 'CUSTOM', label: 'Кастомна', description: 'Інша фаза — без спеціальних прав' },
]

const STAGE_TYPE_COLORS: Record<StageType, string> = {
  REGISTRATION: 'bg-blue-100 text-blue-700 border-blue-200',
  HACKING:      'bg-violet-100 text-violet-700 border-violet-200',
  PRESENTATION: 'bg-amber-100 text-amber-700 border-amber-200',
  JUDGING:      'bg-orange-100 text-orange-700 border-orange-200',
  FINISHED:     'bg-green-100 text-green-700 border-green-200',
  CUSTOM:       'bg-gray-100 text-gray-600 border-gray-200',
}

const emptyForm = { name: '', type: 'CUSTOM' as StageType, startDate: '', endDate: '', orderIndex: '1' }

export function StagesSection({ hackathonId, stages: initialStages = [], hackathonStart, hackathonEnd, mode = 'edit', onChange }: StagesSectionProps) {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  // Local state for create mode
  const [localStages, setLocalStages] = useState<Array<Stage & { id: string }>>([])

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
      }),
    onSuccess: () => {
      toast.success('Стадію додано')
      qc.invalidateQueries({ queryKey: ['stages', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setAdding(false)
      setForm({ ...emptyForm, orderIndex: String(sorted.length + 2) })
    },
    onError: () => toast.error('Помилка при створенні стадії'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Stage> }) =>
      hackathonsApi.updateStage(id, {
        name: data.name,
        type: data.type,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        orderIndex: data.orderIndex !== undefined ? Number(data.orderIndex) : undefined,
      }),
    onSuccess: () => {
      toast.success('Стадію оновлено')
      qc.invalidateQueries({ queryKey: ['stages', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setEditingId(null)
    },
    onError: () => toast.error('Помилка при оновленні стадії'),
  })

  const deleteMut = useMutation({
    mutationFn: (stageId: string) => hackathonsApi.deleteStage(stageId),
    onSuccess: () => {
      toast.success('Стадію видалено')
      qc.invalidateQueries({ queryKey: ['stages', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
    },
    onError: () => toast.error('Помилка при видаленні'),
  })

  const notifyParent = (arr: Array<Stage & { id: string }>) => {
    onChange?.(arr.map(s => ({ name: s.name, type: s.type, startDate: s.startDate, endDate: s.endDate, orderIndex: s.orderIndex })))
  }

  const handleSaveAdd = () => {
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
      updateMut.mutate({ id, data: { name: form.name, type: form.type, startDate: form.startDate, endDate: form.endDate, orderIndex: Number(form.orderIndex) } })
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
    setForm({ ...emptyForm, orderIndex: String(sorted.length + 1) })
  }

  // Build timeline — relative widths based on duration
  const rangeStart = hackathonStart
    ? new Date(hackathonStart).getTime()
    : sorted[0]
    ? new Date(sorted[0].startDate).getTime()
    : Date.now()

  const rangeEnd = hackathonEnd
    ? new Date(hackathonEnd).getTime()
    : sorted.length > 0
    ? new Date(sorted[sorted.length - 1].endDate).getTime()
    : Date.now() + 86400000

  const totalMs = rangeEnd - rangeStart || 1
  const now = Date.now()

  // ── Stage form fields (reused in both add and edit) ────────────────────
  const StageFormFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Назва *</label>
          <input
            placeholder="напр. Перший хакінг"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Тип стадії *</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as StageType })}
            className={inputCls}
          >
            {STAGE_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.description}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Порядок *</label>
          <input
            type="number"
            placeholder="#"
            value={form.orderIndex}
            onChange={(e) => setForm({ ...form, orderIndex: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Початок *</label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Завершення *</label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground italic">Стадії ще не визначені.</p>
      )}

      {/* Stage list */}
      <div className="space-y-2">
        {sorted.map((stage, i) => {
          const start = new Date(stage.startDate).getTime()
          const end = new Date(stage.endDate).getTime()
          const isActive = now >= start && now <= end
          const isPast = now > end
          const typeOpt = STAGE_TYPE_OPTIONS.find(o => o.value === stage.type)
          return (
            <div key={stage.id} className={clsx(
              'rounded-lg border px-4 py-3',
              isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-background',
            )}>
              {editingId === stage.id ? (
                <div className="space-y-3">
                  <StageFormFields />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleSaveEdit(stage.id)}
                      disabled={!form.name || !form.startDate || !form.endDate || updateMut.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                      <Check className="h-3.5 w-3.5" /> Зберегти
                    </button>
                    <button type="button" onClick={handleCancel}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
                      <X className="h-3.5 w-3.5" /> Скасувати
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
                            Зараз
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
                            startDate: new Date(stage.startDate).toISOString().slice(0, 16),
                            endDate: new Date(stage.endDate).toISOString().slice(0, 16),
                            orderIndex: String(stage.orderIndex),
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
        <div className="relative h-8 rounded-lg bg-muted overflow-hidden">
          {sorted.map((stage, i) => {
            const start = new Date(stage.startDate).getTime()
            const end = new Date(stage.endDate).getTime()
            const left = ((start - rangeStart) / totalMs) * 100
            const width = ((end - start) / totalMs) * 100
            return (
              <div
                key={stage.id}
                title={`${stage.name} (${STAGE_TYPE_OPTIONS.find(o => o.value === stage.type)?.label ?? stage.type})`}
                className={clsx('absolute top-0 h-full opacity-80 flex items-center justify-center text-[10px] font-medium text-white overflow-hidden', STAGE_COLORS[i % STAGE_COLORS.length])}
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                {width > 8 && <span className="px-1 truncate">{stage.name}</span>}
              </div>
            )
          })}
          {/* Today marker */}
          {now >= rangeStart && now <= rangeEnd && (
            <div
              className="absolute top-0 h-full w-0.5 bg-white/80 z-10"
              style={{ left: `${((now - rangeStart) / totalMs) * 100}%` }}
            />
          )}
        </div>
      )}

      {adding ? (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4 mt-4">
          <StageFormFields />
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveAdd}
              disabled={!form.name || !form.startDate || !form.endDate || createMut.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              <Check className="h-3.5 w-3.5" /> Зберегти
            </button>
            <button type="button" onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
              <X className="h-3.5 w-3.5" /> Скасувати
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
          <Plus className="h-4 w-4" /> Додати стадію
        </button>
      )}
    </div>
  )
}
