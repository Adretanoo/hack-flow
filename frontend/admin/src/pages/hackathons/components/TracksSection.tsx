import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { Plus, Trash2, Check, X, Pencil } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import { toast } from 'sonner'
import { useI18n } from '@/i18n'
import type { Track } from '@/types/api.types'
import { inputCls } from './FormSection'

interface TracksSectionProps {
  hackathonId?: string
  tracks?: Track[]
  mode?: 'edit' | 'create'
  onChange?: (tracks: Array<{ name: string; description?: string; guidelines?: string }>) => void
}

// ── TrackForm MUST be outside TracksSection to avoid focus loss on re-render ──
interface TrackFormProps {
  name: string
  setName: (v: string) => void
  guidelines: string | undefined
  setGuidelines: (v: string | undefined) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  lang: string
  t: any
}

function TrackForm({ name, setName, guidelines, setGuidelines, onSave, onCancel, isSaving, lang, t }: TrackFormProps) {
  const mdeditorPlaceholder = useMemo(() => {
    return lang === 'uk'
      ? `# Завдання\n\nОпишіть задачу для команд...\n\n## Дозволені технології\n- React, Python, Node.js...\n\n## Зображення\n![Назва](https://example.com/image.png)\n\n## Очікуваний результат\nMVP із демо та презентацією.`
      : `# Task\n\nDescribe the task for teams...\n\n## Allowed Technologies\n- React, Python, Node.js...\n\n## Images\n![Caption](https://example.com/image.png)\n\n## Expected Output\nMVP with demo and presentation.`
  }, [lang])

  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4" data-color-mode="light">
      <div>
        <label className="block text-xs font-medium mb-1">
          {lang === 'uk' ? 'Назва треку *' : 'Track name *'}
        </label>
        <input
          placeholder={lang === 'uk' ? 'Наприклад: AI / Web3 / EdTech' : 'e.g. AI / Web3 / EdTech'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          {lang === 'uk' ? 'Мануал треку' : 'Track manual'}{' '}
          <span className="text-muted-foreground font-normal text-[10px]">
            {lang === 'uk' 
              ? '— Markdown: **жирний**, *курсив*, ## заголовки, - списки, ![alt](url) зображення' 
              : '— Markdown: **bold**, *italic*, ## headings, - lists, ![alt](url) images'}
          </span>
        </label>
        <MDEditor
          value={guidelines}
          onChange={setGuidelines}
          height={320}
          preview="live"
          style={{ borderRadius: '0.5rem', overflow: 'hidden' }}
          textareaProps={{
            placeholder: mdeditorPlaceholder,
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
          <Check className="h-3.5 w-3.5" /> {isSaving ? (lang === 'uk' ? 'Збереження...' : 'Saving...') : t.actions.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-1.5 text-xs hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" /> {t.actions.cancel}
        </button>
      </div>
    </div>
  )
}

export function TracksSection({ hackathonId, tracks: initialTracks = [], mode = 'edit', onChange }: TracksSectionProps) {
  const qc = useQueryClient()
  const { t, lang } = useI18n()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [guidelines, setGuidelines] = useState<string | undefined>('')
  const [localTracks, setLocalTracks] = useState<Array<{ id: string; name: string; guidelines?: string }>>([])

  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => hackathonsApi.listTracks(hackathonId!),
    enabled: mode === 'edit' && !!hackathonId,
  })

  const tracks = mode === 'edit' ? (tracksData?.data.data ?? initialTracks) : (localTracks as unknown as Track[])

  const resetForm = () => { setName(''); setGuidelines('') }

  const createMut = useMutation({
    mutationFn: () => hackathonsApi.createTrack(hackathonId!, {
      name: name.trim(),
      guidelines: guidelines?.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success(lang === 'uk' ? 'Трек додано' : 'Track added')
      qc.invalidateQueries({ queryKey: ['tracks', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setAdding(false); resetForm()
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка при створенні треку' : 'Error creating track'),
  })

  const updateMut = useMutation({
    mutationFn: (id: string) => hackathonsApi.updateTrack(id, {
      name: name.trim(),
      guidelines: guidelines?.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success(lang === 'uk' ? 'Трек оновлено' : 'Track updated')
      qc.invalidateQueries({ queryKey: ['tracks', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      setEditingId(null)
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка при оновленні треку' : 'Error updating track'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => hackathonsApi.deleteTrack(id),
    onSuccess: () => {
      toast.success(lang === 'uk' ? 'Трек видалено' : 'Track deleted')
      qc.invalidateQueries({ queryKey: ['tracks', hackathonId] })
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка при видаленні' : 'Error deleting track'),
  })

  const handleSaveAdd = () => {
    if (mode === 'create') {
      const newArr = [...localTracks, { id: Date.now().toString(), name, guidelines }]
      setLocalTracks(newArr)
      onChange?.(newArr.map(t => ({ name: t.name, guidelines: t.guidelines })))
      setAdding(false); resetForm()
    } else {
      createMut.mutate()
    }
  }

  const handleSaveEdit = (t: Track) => {
    if (mode === 'create') {
      const newArr = localTracks.map(x => x.id === t.id ? { ...x, name, guidelines } : x)
      setLocalTracks(newArr)
      onChange?.(newArr.map(x => ({ name: x.name, guidelines: x.guidelines })))
      setEditingId(null)
    } else {
      updateMut.mutate(t.id)
    }
  }

  const handleDelete = (id: string) => {
    if (mode === 'create') {
      const newArr = localTracks.filter(x => x.id !== id)
      setLocalTracks(newArr)
      onChange?.(newArr.map(x => ({ name: x.name, guidelines: x.guidelines })))
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

  const handleCancel = () => { setAdding(false); setEditingId(null); resetForm() }

  return (
    <div className="space-y-2">
      {tracks.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground italic">
          {lang === 'uk' ? 'Треків ще немає.' : 'No tracks yet.'}
        </p>
      )}

      {tracks.map((track) => (
        <div key={track.id} className="rounded-lg border border-border bg-background overflow-hidden">
          {editingId === track.id ? (
            <div className="p-3">
              <TrackForm
                name={name}
                setName={setName}
                guidelines={guidelines}
                setGuidelines={setGuidelines}
                onSave={() => handleSaveEdit(track)}
                onCancel={handleCancel}
                isSaving={updateMut.isPending}
                lang={lang}
                t={t}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{track.name}</p>
                {(track as any).guidelines && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    📝 {(track as any).guidelines.slice(0, 70)}{(track as any).guidelines.length > 70 ? '…' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" className="rounded-md p-1.5 hover:bg-accent transition-colors" onClick={() => handleEdit(track)}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button type="button" className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors" onClick={() => handleDelete(track.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <TrackForm
          name={name}
          setName={setName}
          guidelines={guidelines}
          setGuidelines={setGuidelines}
          onSave={handleSaveAdd}
          onCancel={handleCancel}
          isSaving={createMut.isPending}
          lang={lang}
          t={t}
        />
      ) : !editingId && (
        <button
          type="button"
          onClick={() => { setAdding(true); setEditingId(null); resetForm() }}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
        >
          <Plus className="h-4 w-4" /> {lang === 'uk' ? 'Додати трек' : 'Add track'}
        </button>
      )}
    </div>
  )
}
