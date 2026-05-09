import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { Plus, Trash2, Check, X, Pencil } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import { toast } from 'sonner'
import type { Track } from '@/types/api.types'
import { inputCls } from './FormSection'

interface TracksSectionProps {
  hackathonId?: string
  tracks?: Track[]
  mode?: 'edit' | 'create'
  onChange?: (tracks: Array<{ name: string; description?: string }>) => void
}

export function TracksSection({
  hackathonId,
  tracks: initialTracks = [],
  mode = 'edit',
  onChange,
}: TracksSectionProps) {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [guidelines, setGuidelines] = useState<string | undefined>('')

  const [localTracks, setLocalTracks] = useState<
    Array<{ id: string; name: string; guidelines?: string }>
  >([])

  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => hackathonsApi.listTracks(hackathonId!),
    enabled: mode === 'edit' && !!hackathonId,
  })

  const tracks =
    mode === 'edit'
      ? (tracksData?.data.data ?? initialTracks)
      : (localTracks as unknown as Track[])

  const resetForm = () => {
    setName('')
    setGuidelines('')
  }

  const createMut = useMutation({
    mutationFn: () =>
      hackathonsApi.createTrack(hackathonId!, {
        name: name.trim(),
        guidelines: guidelines?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Трек додано')
      qc.invalidateQueries({ queryKey: ['tracks', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setAdding(false)
      resetForm()
    },
    onError: () => toast.error('Помилка при створенні треку'),
  })

  const updateMut = useMutation({
    mutationFn: (id: string) =>
      hackathonsApi.updateTrack(id, {
        name: name.trim(),
        guidelines: guidelines?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Трек оновлено')
      qc.invalidateQueries({ queryKey: ['tracks', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setEditingId(null)
    },
    onError: () => toast.error('Помилка при оновленні треку'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => hackathonsApi.deleteTrack(id),
    onSuccess: () => {
      toast.success('Трек видалено')
      qc.invalidateQueries({ queryKey: ['tracks', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
    },
    onError: () => toast.error('Помилка при видаленні'),
  })

  const handleSaveAdd = () => {
    if (mode === 'create') {
      const newArr = [...localTracks, { id: Date.now().toString(), name, guidelines }]
      setLocalTracks(newArr)
      onChange?.(newArr.map((t) => ({ name: t.name })))
      setAdding(false)
      resetForm()
    } else {
      createMut.mutate()
    }
  }

  const handleSaveEdit = (t: Track) => {
    if (mode === 'create') {
      const newArr = localTracks.map((x) =>
        x.id === t.id ? { ...x, name, guidelines } : x
      )
      setLocalTracks(newArr)
      onChange?.(newArr.map((x) => ({ name: x.name })))
      setEditingId(null)
    } else {
      updateMut.mutate(t.id)
    }
  }

  const handleDelete = (id: string) => {
    if (mode === 'create') {
      const newArr = localTracks.filter((x) => x.id !== id)
      setLocalTracks(newArr)
      onChange?.(newArr.map((x) => ({ name: x.name })))
    } else {
      deleteMut.mutate(id)
    }
  }

  const handleEdit = (t: Track) => {
    setEditingId(t.id)
    setName(t.name ?? '')
    setGuidelines((t as any).guidelines ?? '')
    setAdding(false)
  }

  const handleCancel = () => {
    setAdding(false)
    setEditingId(null)
    resetForm()
  }

  // Reusable inline form
  const TrackForm = ({
    onSave,
    isSaving,
  }: {
    onSave: () => void
    isSaving: boolean
  }) => (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4" data-color-mode="light">
      <div>
        <label className="block text-xs font-medium mb-1">Назва треку *</label>
        <input
          placeholder="Наприклад: AI / Web3 / EdTech"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          Мануал треку{' '}
          <span className="text-muted-foreground font-normal">
            — Markdown, підтримуються таблиці, код, заголовки, списки
          </span>
        </label>
        <MDEditor
          value={guidelines}
          onChange={setGuidelines}
          height={300}
          preview="live"
          style={{ borderRadius: '0.5rem', overflow: 'hidden' }}
          textareaProps={{
            placeholder: `# Завдання\n\nОпишіть задачу для команд...\n\n## Дозволені технології\n- React, Python, Node.js...\n\n## Очікуваний результат\nMVP із демо та презентацією.\n\n## Корисні посилання\n[Документація API](https://example.com)`,
          }}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={!name.trim() || isSaving}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" /> {isSaving ? 'Збереження...' : 'Зберегти'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-1.5 text-xs hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" /> Скасувати
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-2">
      {tracks.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground italic">Треків ще немає.</p>
      )}

      {tracks.map((t) => (
        <div key={t.id} className="rounded-lg border border-border bg-background overflow-hidden">
          {editingId === t.id ? (
            <div className="p-3">
              <TrackForm onSave={() => handleSaveEdit(t)} isSaving={updateMut.isPending} />
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.name}</p>
                {(t as any).guidelines && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    📝 Мануал: {(t as any).guidelines.slice(0, 60)}
                    {(t as any).guidelines.length > 60 ? '…' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
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
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <TrackForm onSave={handleSaveAdd} isSaving={createMut.isPending} />
      ) : (
        !editingId && (
          <button
            type="button"
            onClick={() => {
              setAdding(true)
              setEditingId(null)
              resetForm()
            }}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
          >
            <Plus className="h-4 w-4" /> Додати трек
          </button>
        )
      )}
    </div>
  )
}
