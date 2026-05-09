import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import {
  Plus, Trash2, ExternalLink, Link as LinkIcon, Lock,
  BookOpen, ChevronDown, ChevronUp, Send, FileText, CheckCircle2, AlertCircle,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { projectsApi } from '@/api/projects'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Hackathon, Team } from '@/types/api.types'

interface ProjectTabProps {
  hackathon: Hackathon
  myTeam?: Team
  stageInfo: ReturnType<typeof import('@/hooks/useHackathonStage').useHackathonStage>
}

// ── Track Manual Card ──────────────────────────────────────────────────────────
function TrackManual({ track }: { track: any }) {
  const [open, setOpen] = useState(false)
  const hasManual = !!track.guidelines

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold">Мануал треку: {track.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasManual
                ? 'Натисніть щоб переглянути інструкції організаторів'
                : track.description || 'Організатори ще не заповнили мануал цього треку'}
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-border px-6 py-5 bg-muted/10">
          {hasManual ? (
            <div className="prose prose-sm max-w-none
              prose-headings:font-semibold prose-headings:text-foreground
              prose-p:text-foreground prose-p:leading-relaxed
              prose-li:text-foreground prose-strong:text-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-sm
              prose-blockquote:border-primary prose-blockquote:text-muted-foreground
            ">
              <ReactMarkdown>{track.guidelines}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Організатори ще не заповнили детальний мануал для цього треку.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Submit Confirm Modal ───────────────────────────────────────────────────────
function SubmitConfirmModal({ onConfirm, onCancel, isPending }: {
  onConfirm: () => void; onCancel: () => void; isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6 mx-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Подати проєкт на розгляд?</h3>
            <p className="text-sm text-muted-foreground">Після подачі редагування буде недоступне</p>
          </div>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 space-y-1">
          <p className="font-semibold">⚠️ Переконайтесь що:</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700">
            <li>Назва і опис проєкту заповнені</li>
            <li>Додано посилання на Git-репозиторій</li>
            <li>Демо або презентація прикріплені (якщо є)</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
            Скасувати
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {isPending ? 'Подаємо...' : 'Так, подати'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ProjectTab ─────────────────────────────────────────────────────────────
export function ProjectTab({ myTeam, stageInfo }: ProjectTabProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset } = useForm<{ title: string; description: string }>()
  const { register: registerRes, handleSubmit: handleResSubmit, reset: resetRes } = useForm()
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const track = (myTeam as any)?.track ?? null

  const { data: projData, isLoading } = useQuery({
    queryKey: ['team-project', myTeam?.id],
    queryFn: () => projectsApi.list({ teamId: myTeam?.id }).then(res => res.data.data[0]),
    enabled: !!myTeam?.id,
  })

  const { data: projectDetails } = useQuery({
    queryKey: ['project-details', projData?.id],
    queryFn: () => projectsApi.getById(projData!.id).then(res => res.data.data),
    enabled: !!projData?.id,
  })

  const project = projectDetails || projData

  const { data: resTypesData } = useQuery({
    queryKey: ['project-resource-types'],
    queryFn: () => projectsApi.getResourceTypes().then(res => res.data.data),
  })

  const resourceTypes = resTypesData || [
    { id: 'github', name: 'GitHub Repo' },
    { id: 'demo', name: 'Demo URL' },
    { id: 'presentation', name: 'Презентація' },
  ]

  useEffect(() => {
    if (project) {
      reset({
        title: (project as any).title ?? '',
        description: (project as any).description ?? '',
      })
    }
  }, [project, reset])

  const createMut = useMutation({
    mutationFn: () => projectsApi.create({
      teamId: myTeam!.id,
      stageId: stageInfo.activeStage?.id ?? '',
      title: `Проєкт команди ${myTeam!.name}`,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-project'] })
    },
    onError: () => {},
  })

  const updateMut = useMutation({
    mutationFn: (data: { title: string; description: string }) =>
      projectsApi.update(project!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-details'] })
    },
    onError: () => {},
  })

  const submitMut = useMutation({
    mutationFn: () => projectsApi.submit(project!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-details'] })
      setShowSubmitModal(false)
    },
    onError: () => {
      setShowSubmitModal(false)
    },
  })

  const addResourceMut = useMutation({
    mutationFn: (data: any) => projectsApi.addResource(project!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-details'] })
      resetRes()
    },
    onError: () => {},
  })

  const removeResourceMut = useMutation({
    mutationFn: (resId: string) => projectsApi.removeResource(project!.id, resId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-details'] }),
  })

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (!myTeam) {
    return (
      <div className="mt-6 text-center py-24 text-muted-foreground">
        Спершу створіть або приєднайтесь до команди
      </div>
    )
  }

  const isBlocked = myTeam.approvalStatus === 'REJECTED' || myTeam.approvalStatus === 'DISQUALIFIED'
  if (isBlocked) {
    const latestComment = (myTeam as any).approvals?.[0]?.comment as string | undefined
    const isRejected = myTeam.approvalStatus === 'REJECTED'
    return (
      <div className={`mt-6 rounded-xl border p-8 text-center space-y-3 ${isRejected ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
        <div className="text-4xl">{isRejected ? '⛔' : '🚫'}</div>
        <h3 className={`text-xl font-bold ${isRejected ? 'text-red-800' : 'text-orange-800'}`}>
          {isRejected ? 'Команду відхилено' : 'Команду дискваліфіковано'}
        </h3>
        {latestComment && (
          <div className={`mx-auto max-w-md rounded-lg px-4 py-3 text-sm ${isRejected ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
            <span className="font-medium">Причина: </span>{latestComment}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) return <div className="py-24"><LoadingSpinner /></div>

  const isEditable = project?.status === 'DRAFT' && stageInfo.canSubmit
  const hasGitResource = project?.resources?.some((r: any) => /github|gitlab|bitbucket/i.test(r.url))

  // Status config
  const statusConfig: Record<string, { label: string; icon: any; cls: string; desc: string }> = {
    DRAFT:     { label: 'Чернетка', icon: FileText,      cls: 'border-amber-200 bg-amber-50 text-amber-800',    desc: 'Заповніть інформацію та подайте до кінця етапу розробки.' },
    SUBMITTED: { label: 'На розгляді', icon: Send,       cls: 'border-blue-200 bg-blue-50 text-blue-800',       desc: 'Проєкт передано організаторам/суддям на перевірку.' },
    APPROVED:  { label: 'Схвалено', icon: CheckCircle2,  cls: 'border-green-200 bg-green-50 text-green-800',    desc: 'Ваш проєкт прийнято до участі в конкурсі!' },
    REJECTED:  { label: 'Відхилено', icon: AlertCircle,  cls: 'border-red-200 bg-red-50 text-red-800',          desc: (project as any)?.comment ?? 'Оновіть проєкт та зверніться до організаторів.' },
    REVIEWED:  { label: 'Переглянуто', icon: CheckCircle2, cls: 'border-purple-200 bg-purple-50 text-purple-800', desc: 'Проєкт переглянуто суддями.' },
  }
  const st = statusConfig[project?.status ?? 'DRAFT']

  return (
    <>
      {showSubmitModal && (
        <SubmitConfirmModal
          onConfirm={() => submitMut.mutate()}
          onCancel={() => setShowSubmitModal(false)}
          isPending={submitMut.isPending}
        />
      )}

      <div className="mt-6 space-y-6">
        {/* Track Manual */}
        {track && <TrackManual track={track} />}

        {/* No project yet */}
        {!project && (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Проєкт ще не створено</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                Створіть чернетку проєкту, заповніть назву, опис та додайте посилання на репозиторій.
              </p>
            </div>
            {!stageInfo.canSubmit ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-md text-sm font-medium text-muted-foreground">
                <Lock className="h-4 w-4" /> Доступно під час етапу розробки
              </div>
            ) : (
              <button
                onClick={() => createMut.mutate()}
                disabled={createMut.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {createMut.isPending ? 'Створення...' : 'Створити проєкт'}
              </button>
            )}
          </div>
        )}

        {/* Project exists */}
        {project && (
          <>
            {/* Status banner */}
            {st && (
              <div className={`rounded-xl border p-4 flex items-start justify-between gap-4 ${st.cls}`}>
                <div className="flex items-start gap-3">
                  <st.icon className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{st.label}</p>
                    <p className="text-sm mt-0.5 opacity-90">{st.desc}</p>
                  </div>
                </div>
                {project.status === 'DRAFT' && stageInfo.canSubmit && (
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      disabled={!hasGitResource}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" /> Подати на розгляд
                    </button>
                    {!hasGitResource && (
                      <p className="text-xs text-red-600 font-medium text-right max-w-[200px]">
                        Потрібне посилання на GitHub / GitLab
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Info form */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2">Основна інформація</h3>
                <form onSubmit={handleSubmit((d) => updateMut.mutate(d))} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Назва проєкту *</label>
                    <input
                      {...register('title', { required: true })}
                      disabled={!isEditable}
                      placeholder="Введіть назву проєкту"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:bg-muted disabled:text-muted-foreground transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Опис проєкту</label>
                    <textarea
                      {...register('description')}
                      disabled={!isEditable}
                      rows={5}
                      placeholder="Розкажіть про ідею, рішення та технологічний стек..."
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background resize-none outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:bg-muted disabled:text-muted-foreground transition-colors"
                    />
                  </div>
                  {isEditable && (
                    <div className="flex justify-end pt-1">
                      <button type="submit" disabled={updateMut.isPending}
                        className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-60 transition-colors">
                        {updateMut.isPending ? 'Збереження...' : 'Зберегти зміни'}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Resources */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2">Посилання та ресурси</h3>

                <div className="space-y-2 mb-5">
                  {(!project.resources || project.resources.length === 0) && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Ресурсів ще немає</p>
                      <p className="text-xs mt-0.5">Додайте посилання на репозиторій, демо або презентацію</p>
                    </div>
                  )}
                  {project.resources?.map((res: any) => (
                    <div key={res.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <LinkIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate">{res.description || res.type}</p>
                          <a href={res.url} target="_blank" rel="noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
                            {res.url} <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </div>
                      </div>
                      {isEditable && (
                        <button onClick={() => removeResourceMut.mutate(res.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-md ml-2 shrink-0 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isEditable && (
                  <form onSubmit={handleResSubmit((d) => addResourceMut.mutate(d))}
                    className="space-y-3 border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground">Додати посилання</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select {...registerRes('projectTypeId', { required: true })}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background outline-none focus:border-ring">
                        <option value="">Тип ресурсу...</option>
                        {resourceTypes.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <input {...registerRes('description')} placeholder="Опис (необов'язково)"
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background outline-none focus:border-ring" />
                    </div>
                    <div className="flex gap-2">
                      <input {...registerRes('url', { required: true })} placeholder="https://github.com/..."
                        className="flex-1 rounded-lg border border-border px-3 py-2 text-sm bg-background outline-none focus:border-ring" />
                      <button type="submit" disabled={addResourceMut.isPending}
                        className="shrink-0 flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-60 transition-colors">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
