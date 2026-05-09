import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Settings, Pencil, XCircle, AlertTriangle, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { teamsApi } from '@/api/teams'
import type { Hackathon, Team } from '@/types/api.types'

interface SettingsTabProps {
  hackathon: Hackathon
  myTeam?: Team
}

type EditForm = { name: string; description?: string; trackId?: string }

export function SettingsTab({ hackathon, myTeam }: SettingsTabProps) {
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const tracks = (hackathon as any).tracks ?? []

  const isCaptain = !!(myTeam as any)?.myRole
    ? (myTeam as any).myRole === 'captain'
    : false

  // ── No team ────────────────────────────────────────────────────────────────
  if (!myTeam) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
        <Settings className="mx-auto mb-3 h-8 w-8 opacity-40" />
        <p className="font-medium">Ти ще не в команді</p>
        <p className="text-sm mt-1">Спочатку приєднайся або створи команду на вкладці «Моя команда».</p>
      </div>
    )
  }

  // ── Non-captain ────────────────────────────────────────────────────────────
  if (!isCaptain) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
        <Settings className="mx-auto mb-3 h-8 w-8 opacity-40" />
        <p className="font-medium">Налаштування команди</p>
        <p className="text-sm mt-1">Тільки капітан команди може змінювати налаштування.</p>
      </div>
    )
  }

  return <CaptainSettings myTeam={myTeam} tracks={tracks} queryClient={queryClient} editOpen={editOpen} setEditOpen={setEditOpen} deleteOpen={deleteOpen} setDeleteOpen={setDeleteOpen} deleteConfirmName={deleteConfirmName} setDeleteConfirmName={setDeleteConfirmName} />
}

// ─── Internal component (captain only) ────────────────────────────────────────

function CaptainSettings({
  myTeam,
  tracks,
  queryClient,
  editOpen, setEditOpen,
  deleteOpen, setDeleteOpen,
  deleteConfirmName, setDeleteConfirmName,
}: {
  myTeam: Team
  tracks: any[]
  queryClient: ReturnType<typeof useQueryClient>
  editOpen: boolean; setEditOpen: (v: boolean) => void
  deleteOpen: boolean; setDeleteOpen: (v: boolean) => void
  deleteConfirmName: string; setDeleteConfirmName: (v: string) => void
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>({
    defaultValues: {
      name: myTeam.name,
      description: (myTeam as any).description ?? '',
      trackId: (myTeam as any).track?.id ?? (myTeam as any).trackId ?? '',
    },
  })

  const updateMut = useMutation({
    mutationFn: (data: EditForm) =>
      teamsApi.update(myTeam.id, { ...data, trackId: data.trackId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-team'] })
      setEditOpen(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => teamsApi.deleteTeam(myTeam.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-team'] })
    },
  })

  return (
    <div className="mt-6 space-y-4">

      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card px-6 py-5 flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Налаштування команди</h2>
          <p className="text-sm text-muted-foreground">Керуй командою — редагуй або видаляй</p>
        </div>
      </div>

      {/* ── Edit team ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Collapsible header */}
        <button
          type="button"
          onClick={() => {
            setEditOpen(!editOpen)
            reset({ name: myTeam.name, description: (myTeam as any).description ?? '', trackId: (myTeam as any).track?.id ?? '' })
          }}
          className="w-full flex items-center gap-3 px-6 py-4 text-left bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border"
        >
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Pencil className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold">Редагувати команду</p>
            <p className="text-xs text-muted-foreground">Назва, опис, трек</p>
          </div>
          <span className="ml-auto">
            {editOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </span>
        </button>

        {editOpen && (
          <form onSubmit={handleSubmit((d) => updateMut.mutate(d))} className="p-6 space-y-4">
            {/* Warning */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Після збереження статус команди буде змінено на <strong>«Очікує перегляду»</strong> — організатор повинен повторно затвердити зміни.</span>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Назва команди *</label>
              <input
                {...register('name', { required: true, minLength: 2 })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">Мінімум 2 символи</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Опис</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background resize-none focus:border-primary focus:outline-none"
              />
            </div>

            {/* Track */}
            {tracks.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Напрямок (трек)</label>
                <select
                  {...register('trackId')}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                >
                  <option value="">— Без треку —</option>
                  {tracks.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Зміна треку потребує затвердження організатора.</p>
              </div>
            )}

            {/* Feedback */}
            {updateMut.isError && (
              <p className="text-xs text-destructive">{(updateMut.error as any)?.message || 'Помилка збереження'}</p>
            )}
            {updateMut.isSuccess && (
              <p className="text-xs text-green-600">✅ Зміни збережено. Очікуйте затвердження організатора.</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex-1 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={updateMut.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                {updateMut.isPending ? 'Збереження...' : 'Зберегти зміни'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Danger zone: Delete team ───────────────────────────────── */}
      <div className="rounded-xl border border-red-200 bg-red-50/40 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => { setDeleteOpen(!deleteOpen); setDeleteConfirmName('') }}
          className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-red-50 transition-colors border-b border-red-200"
        >
          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive">Видалити команду</p>
            <p className="text-xs text-muted-foreground">Незворотня дія — всі дані будуть видалені</p>
          </div>
          <span className="ml-auto">
            {deleteOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </span>
        </button>

        {deleteOpen && (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-100 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">Незворотня дія!</p>
                <p className="mt-1">Команда буде розпущена. Всі учасники, запрошення та дані команди будуть видалені. Відновити неможливо.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Введіть назву команди <strong>{myTeam.name}</strong> для підтвердження:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={myTeam.name}
                className="w-full rounded-md border border-red-300 px-3 py-2 text-sm bg-background focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>

            {deleteMut.isError && (
              <p className="text-xs text-destructive">{(deleteMut.error as any)?.message || 'Помилка видалення'}</p>
            )}

            <button
              onClick={() => deleteMut.mutate()}
              disabled={deleteConfirmName !== myTeam.name || deleteMut.isPending}
              className="w-full rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {deleteMut.isPending ? 'Видалення...' : '🗑 Видалити команду назавжди'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
