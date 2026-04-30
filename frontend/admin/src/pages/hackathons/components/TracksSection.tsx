import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Track } from '@/types/api.types'
import { inputCls } from './FormSection'

interface TracksSectionProps {
  hackathonId: string
  tracks?: Track[] // Optional now, since we fetch internally
}

export function TracksSection({ hackathonId, tracks: initialTracks = [] }: TracksSectionProps) {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => hackathonsApi.listTracks(hackathonId),
  })

  const tracks = tracksData?.data.data ?? initialTracks

  const createMut = useMutation({
    mutationFn: () => hackathonsApi.createTrack(hackathonId, { name: newName, description: newDesc || undefined }),
    onSuccess: () => {
      toast.success('Трек додано')
      qc.invalidateQueries({ queryKey: ['tracks', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setAdding(false); setNewName(''); setNewDesc('')
    },
    onError: () => toast.error('Помилка при створенні треку'),
  })

  const deleteMut = useMutation({
    mutationFn: (trackId: string) => hackathonsApi.deleteTrack(trackId),
    onSuccess: () => { 
      toast.success('Трек видалено'); 
      qc.invalidateQueries({ queryKey: ['tracks', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
    },
    onError: () => toast.error('Помилка при видаленні'),
  })

  return (
    <div className="space-y-2">
      {tracks.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground italic">Треків ще немає.</p>
      )}
      {tracks.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 bg-background">
          <div>
            <p className="text-sm font-medium">{t.name}</p>
            {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
          </div>
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors"
            onClick={() => deleteMut.mutate(t.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <input placeholder="Назва треку *" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputCls} />
          <input placeholder="Опис (необов'язково)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <button type="button" onClick={() => createMut.mutate()} disabled={!newName.trim() || createMut.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              <Check className="h-3.5 w-3.5" /> Зберегти
            </button>
            <button type="button" onClick={() => { setAdding(false); setNewName(''); setNewDesc('') }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
              <X className="h-3.5 w-3.5" /> Скасувати
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full">
          <Plus className="h-4 w-4" /> Додати трек
        </button>
      )}
    </div>
  )
}
