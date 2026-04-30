import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tagsApi } from '@/api/tags'
import { hackathonsApi } from '@/api/hackathons'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Tag } from '@/types/api.types'
import { inputCls } from './FormSection'

interface TagsSectionProps {
  hackathonId: string
  selectedTags: Tag[]
}

export function TagsSection({ hackathonId, selectedTags }: TagsSectionProps) {
  const qc = useQueryClient()
  const [newTagName, setNewTagName] = useState('')
  const [creating, setCreating] = useState(false)

  const { data: allTagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  })
  const allTags: Tag[] = allTagsData?.data.data ?? []
  const selectedIds = selectedTags.map((t) => t.id)
  const unselected = allTags.filter((t) => !selectedIds.includes(t.id))

  const attachMut = useMutation({
    mutationFn: (tagId: string) => hackathonsApi.attachTags(hackathonId, [tagId]),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] }),
    onError: () => toast.error('Помилка при додаванні тегу'),
  })

  const detachMut = useMutation({
    mutationFn: (tagId: string) => hackathonsApi.detachTag(hackathonId, tagId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hackathon', hackathonId] }),
    onError: () => toast.error('Помилка при видаленні тегу'),
  })

  const createMut = useMutation({
    mutationFn: () => tagsApi.create(newTagName),
    onSuccess: (res) => {
      const tag = res.data.data
      qc.invalidateQueries({ queryKey: ['tags'] })
      attachMut.mutate(tag.id)
      setNewTagName(''); setCreating(false)
    },
    onError: () => toast.error('Помилка при створенні тегу'),
  })

  return (
    <div className="space-y-3">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span key={tag.id} className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {tag.name}
            <button type="button" onClick={() => detachMut.mutate(tag.id)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {selectedTags.length === 0 && <p className="text-sm text-muted-foreground italic">Теги не вибрані</p>}
      </div>

      {/* Available tags to add */}
      {unselected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unselected.map((tag) => (
            <button key={tag.id} type="button" onClick={() => attachMut.mutate(tag.id)}
              className="rounded-full border border-dashed border-border px-3 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              + {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Create new tag */}
      {creating ? (
        <div className="flex gap-2">
          <input placeholder="Назва нового тегу" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
            className={inputCls} onKeyDown={(e) => e.key === 'Enter' && newTagName.trim() && createMut.mutate()} />
          <button type="button" onClick={() => createMut.mutate()} disabled={!newTagName.trim()}
            className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            Створити
          </button>
          <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" /> Створити новий тег
        </button>
      )}
    </div>
  )
}
