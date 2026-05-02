import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { Plus, Trash2, Check, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Track } from '@/types/api.types'
import { inputCls } from './FormSection'

interface TracksSectionProps {
  hackathonId?: string
  tracks?: Track[]
  mode?: 'edit' | 'create'
  onChange?: (tracks: Array<{ name: string; description?: string }>) => void
}

export function TracksSection({ hackathonId, tracks: initialTracks = [], mode = 'edit', onChange }: TracksSectionProps) {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // Local state for create mode
  const [localTracks, setLocalTracks] = useState<Array<{ id: string; name: string; description?: string }>>([])

  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => hackathonsApi.listTracks(hackathonId!),
    enabled: mode === 'edit' && !!hackathonId,
  })

  const tracks = mode === 'edit' ? (tracksData?.data.data ?? initialTracks) : (localTracks as Track[])

  const createMut = useMutation({
    mutationFn: () => hackathonsApi.createTrack(hackathonId!, { name: newName, description: newDesc || undefined }),
    onSuccess: () => {
      toast.success('Трек додано')
      qc.invalidateQueries({ queryKey: ['tracks', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setAdding(false); setNewName(''); setNewDesc('')
    },
    onError: () => toast.error('Помилка при створенні треку'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Track> }) => hackathonsApi.updateTrack(id, data),
    onSuccess: () => {
      toast.success('Трек оновлено')
      qc.invalidateQueries({ queryKey: ['tracks', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setEditingId(null)
    },
    onError: () => toast.error('Помилка при оновленні треку'),
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

  const handleSaveAdd = () => {
    if (mode === 'create') {
      const newArr = [...localTracks, { id: Date.now().toString(), name: newName, description: newDesc || undefined }]
      setLocalTracks(newArr)
      onChange?.(newArr.map(t => ({ name: t.name, description: t.description })))
      setAdding(false); setNewName(''); setNewDesc('')
    } else {
      createMut.mutate()
    }
  }

  const handleSaveEdit = (t: Track) => {
    if (mode === 'create') {
      const newArr = localTracks.map(x => x.id === t.id ? { ...x, name: newName, description: newDesc || undefined } : x)
      setLocalTracks(newArr)
      onChange?.(newArr.map(x => ({ name: x.name, description: x.description })))
      setEditingId(null)
    } else {
      updateMut.mutate({ id: t.id, data: { name: newName, description: newDesc || undefined } })
    }
  }

  const handleDelete = (id: string) => {
    if (mode === 'create') {
      const newArr = localTracks.filter(x => x.id !== id)
      setLocalTracks(newArr)
      onChange?.(newArr.map(x => ({ name: x.name, description: x.description })))
    } else {
      deleteMut.mutate(id)
    }
  }

  const handleEdit = (t: Track) => {
    setEditingId(t.id)
    setNewName(t.name)
    setNewDesc(t.description || '')
    setAdding(false)
  }

  const handleCancel = () => {
    setAdding(false)
    setEditingId(null)
    setNewName('')
    setNewDesc('')
  }

  return (
    <div className="space-y-2">
      {tracks.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground italic">Треків ще немає.</p>
      )}
      {tracks.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 bg-background">
          {editingId === t.id ? (
            <div className="w-full space-y-2">
              <input placeholder="Назва треку *" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputCls} />
              <input placeholder="Опис (необов'язково)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className={inputCls} />
              <div className="flex gap-2">
                <button type="button" onClick={() => handleSaveEdit(t)} disabled={!newName.trim() || updateMut.isPending}
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
            <>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-md p-1.5 hover:bg-accent transition-colors"
                  onClick={() => handleEdit(t)}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {adding ? (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <input placeholder="Назва треку *" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputCls} />
          <input placeholder="Опис (необов'язково)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveAdd} disabled={!newName.trim() || createMut.isPending}
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
        <button type="button" onClick={() => { setAdding(true); setEditingId(null); setNewName(''); setNewDesc('') }}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full">
          <Plus className="h-4 w-4" /> Додати трек
        </button>
      )}
    </div>
  )
}
