import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/utils/format'
import type { Stage } from '@/types/api.types'
import { clsx } from 'clsx'
import { inputCls } from './FormSection'

interface StagesSectionProps {
  hackathonId: string
  stages?: Stage[]
  hackathonStart?: string
  hackathonEnd?: string
}

const STAGE_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-rose-500',
]

export function StagesSection({ hackathonId, stages: initialStages = [], hackathonStart, hackathonEnd }: StagesSectionProps) {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', orderIndex: '1' })

  const { data: stagesData } = useQuery({
    queryKey: ['stages', hackathonId],
    queryFn: () => hackathonsApi.listStages(hackathonId),
  })

  const stages = stagesData?.data.data ?? initialStages
  const sorted = [...stages].sort((a, b) => a.orderIndex - b.orderIndex)

  const createMut = useMutation({
    mutationFn: () =>
      hackathonsApi.createStage(hackathonId, {
        name: form.name,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        orderIndex: Number(form.orderIndex),
      }),
    onSuccess: () => {
      toast.success('Стадію додано')
      qc.invalidateQueries({ queryKey: ['stages', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setAdding(false)
      setForm({ name: '', startDate: '', endDate: '', orderIndex: String(sorted.length + 2) })
    },
    onError: () => toast.error('Помилка при створенні стадії'),
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
          return (
            <div key={stage.id} className={clsx(
              'flex items-center justify-between rounded-lg border px-4 py-3',
              isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-background',
            )}>
              <div className="flex items-center gap-3">
                <span className={clsx('h-2.5 w-2.5 rounded-full', STAGE_COLORS[i % STAGE_COLORS.length])} />
                <div>
                  <p className={clsx('text-sm font-medium', isPast && 'text-muted-foreground line-through')}>
                    {stage.name}
                    {isActive && (
                      <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary font-normal">
                        Зараз
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(stage.startDate)} — {formatDate(stage.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  className="rounded-md p-1 hover:bg-destructive/10 transition-colors"
                  onClick={() => deleteMut.mutate(stage.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
                <span className="text-xs text-muted-foreground">#{stage.orderIndex}</span>
              </div>
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
                title={stage.name}
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
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Назва (напр. REGISTRATION) *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Порядок *" value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Початок *</label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Завершення *</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => createMut.mutate()} disabled={!form.name || !form.startDate || !form.endDate || createMut.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              <Check className="h-3.5 w-3.5" /> Зберегти
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
              <X className="h-3.5 w-3.5" /> Скасувати
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full mt-4">
          <Plus className="h-4 w-4" /> Додати стадію
        </button>
      )}
    </div>
  )
}
