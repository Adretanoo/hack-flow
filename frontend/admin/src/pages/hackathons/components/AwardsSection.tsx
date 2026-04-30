import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { Plus, Trash2, Trophy, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Award } from '@/types/api.types'
import { inputCls } from './FormSection'

interface AwardsSectionProps {
  hackathonId: string
  awards?: Award[]
}

const PLACE_COLORS: Record<number, string> = {
  1: 'bg-amber-400 text-white',
  2: 'bg-gray-300 text-gray-800',
  3: 'bg-amber-600 text-white',
}

export function AwardsSection({ hackathonId, awards: initialAwards = [] }: AwardsSectionProps) {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', place: '1', description: '', certificate: '' })

  const { data: awardsData } = useQuery({
    queryKey: ['awards', hackathonId],
    queryFn: () => hackathonsApi.listAwards(hackathonId),
  })

  const awards = awardsData?.data.data ?? initialAwards

  const createMut = useMutation({
    mutationFn: () =>
      hackathonsApi.createAward(hackathonId, {
        name: form.name,
        place: Number(form.place),
        description: form.description || undefined,
        certificate: form.certificate || undefined,
      }),
    onSuccess: () => {
      toast.success('Нагороду додано')
      qc.invalidateQueries({ queryKey: ['awards', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setAdding(false)
      setForm({ name: '', place: '1', description: '', certificate: '' })
    },
    onError: () => toast.error('Помилка при створенні нагороди'),
  })

  const deleteMut = useMutation({
    mutationFn: (awardId: string) => hackathonsApi.deleteAward(hackathonId, awardId),
    onSuccess: () => {
      toast.success('Нагороду видалено')
      qc.invalidateQueries({ queryKey: ['awards', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
    },
    onError: () => toast.error('Помилка при видаленні'),
  })

  const sorted = [...awards].sort((a, b) => a.place - b.place)

  return (
    <div className="space-y-3">
      {sorted.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground italic">Нагород ще немає.</p>
      )}

      {sorted.map((award) => (
        <div key={award.id} className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${PLACE_COLORS[award.place] ?? 'bg-muted text-muted-foreground'}`}>
            {award.place}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <p className="text-sm font-medium">{award.name}</p>
            </div>
            {award.description && <p className="text-xs text-muted-foreground mt-0.5">{award.description}</p>}
            {award.certificate && (
              <a href={award.certificate} target="_blank" rel="noreferrer"
                className="text-xs text-primary hover:underline mt-0.5 block">
                🎖 Сертифікат
              </a>
            )}
          </div>
          <button type="button" onClick={() => deleteMut.mutate(award.id)}
            className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors shrink-0">
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Назва нагороди *" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input type="number" min="1" max="100" placeholder="Місце *" value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })} className={inputCls} />
          </div>
          <input placeholder="Опис (необов'язково)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
          <input placeholder="URL сертифіката (необов'язково)" value={form.certificate}
            onChange={(e) => setForm({ ...form, certificate: e.target.value })} className={inputCls} />
          <div className="flex gap-2">
            <button type="button" onClick={() => createMut.mutate()}
              disabled={!form.name.trim() || !form.place || createMut.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              <Check className="h-3.5 w-3.5" /> Додати
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
              <X className="h-3.5 w-3.5" /> Скасувати
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full">
          <Plus className="h-4 w-4" /> Додати нагороду
        </button>
      )}
    </div>
  )
}
