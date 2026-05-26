import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import {
  Plus, Trash2, ExternalLink, Link as LinkIcon, Lock, BookOpen,
  ChevronDown, ChevronUp, Send, FileText, CheckCircle2, AlertCircle,
  Clock, Pencil, X, RotateCcw, AlertTriangle,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { projectsApi } from '@/api/projects'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { toast } from 'sonner'
import { formatDateTime } from '@/utils/format'
import type { Team } from '@/types/api.types'
import { useI18n } from '@/i18n'

interface ProjectTabProps {
  myTeam?: Team
  stageInfo: ReturnType<typeof import('@/hooks/useHackathonStage').useHackathonStage>
}

const TYPE_ICONS: Record<string, string> = {
  repository: '🔗', demo: '🌐', presentation: '📊',
  video: '🎥', documentation: '📄', other: '🔧',
}

function TrackManual({ track }: { track: any }) {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold">{t.projectTab.trackManual.replace('{name}', track.name)}</p>
            <p className="text-xs text-muted-foreground">{track.guidelines ? t.projectTab.clickToView : t.projectTab.manualEmpty}</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && track.guidelines && (
        <div className="border-t border-border px-6 py-5 bg-muted/10">
          <div className="prose prose-sm max-w-none prose-img:rounded-lg">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{track.guidelines}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}

function Countdown({ endDate }: { endDate: string }) {
  const [diff, setDiff] = useState(0)
  const { t } = useI18n()
  useEffect(() => {
    const update = () => setDiff(Math.max(0, new Date(endDate).getTime() - Date.now()))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [endDate])
  if (diff <= 0) return <span className="text-red-500 font-semibold text-xs">{t.projectTab.timeExpired}</span>
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return <span className="font-mono text-xs tabular-nums">{h}{t.projectTab.timeHours} {m}{t.projectTab.timeMinutes} {s}{t.projectTab.timeSeconds}</span>
}

export function ProjectTab({ myTeam, stageInfo }: ProjectTabProps) {
  const qc = useQueryClient()
  const { t } = useI18n()
  const { register, handleSubmit, reset, watch } = useForm<{ title: string; description: string }>()
  const resForm = useForm<{ projectTypeId: string; url: string; description: string }>()
  const [showResForm, setShowResForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const titleVal = watch('title', '')
  const resUrl = resForm.watch('url', '')
  const track = (myTeam as any)?.track ?? null

  const { data: projData, isLoading } = useQuery({
    queryKey: ['team-project', myTeam?.id],
    queryFn: () => projectsApi.list({ teamId: myTeam?.id }).then(r => r.data.data[0]),
    enabled: !!myTeam?.id,
  })

  const { data: projectDetails } = useQuery({
    queryKey: ['project-details', projData?.id],
    queryFn: () => projectsApi.getById(projData!.id).then(r => r.data.data),
    enabled: !!projData?.id,
  })

  const { data: resTypesData } = useQuery({
    queryKey: ['project-resource-types'],
    queryFn: () => projectsApi.getResourceTypes().then(r => r.data.data),
  })

  const project = (projectDetails ?? projData) as any
  const resources: any[] = project?.resources ?? []
  const resourceTypes: any[] = resTypesData ?? []
  const status: string = project?.status ?? 'DRAFT'

  const isHackingActive = (stageInfo.activeStage as any)?.type === 'HACKING' && stageInfo.canSubmit
  const hackingEndDate = (stageInfo.activeStage as any)?.endDate
  const isEditing = editMode && (status === 'DRAFT' || status === 'REJECTED')
  const canSubmit = status === 'DRAFT' && stageInfo.canSubmit && titleVal.trim().length > 0

  useEffect(() => {
    if (project) reset({ title: project.title ?? '', description: project.description ?? '' })
  }, [project, reset])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['project-details', projData?.id] })
    qc.invalidateQueries({ queryKey: ['team-project', myTeam?.id] })
  }

  const createMut = useMutation({
    mutationFn: (d: { title: string; description: string }) => projectsApi.create({
      teamId: myTeam!.id, stageId: stageInfo.activeStage?.id ?? '', title: d.title, description: d.description,
    }),
    onSuccess: () => { toast.success(t.states.success); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? t.states.error),
  })

  const updateMut = useMutation({
    mutationFn: (d: { title: string; description: string }) => projectsApi.update(project!.id, d),
    onSuccess: () => { toast.success(t.states.success); setEditMode(false); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? t.states.error),
  })

  const reopenMut = useMutation({
    mutationFn: () => projectsApi.reopen(project!.id),
    onSuccess: () => { toast.success(t.states.success); setEditMode(true); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? t.states.error),
  })

  const submitMut = useMutation({
    mutationFn: () => projectsApi.submit(project!.id),
    onSuccess: () => { toast.success(t.states.success); setShowConfirm(false); invalidate() },
    onError: (e: any) => { toast.error(e?.response?.data?.message ?? t.states.error); setShowConfirm(false) },
  })

  const addResMut = useMutation({
    mutationFn: (d: any) => projectsApi.addResource(project!.id, d),
    onSuccess: () => { toast.success(t.states.success); setShowResForm(false); resForm.reset(); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? t.states.error),
  })

  const delResMut = useMutation({
    mutationFn: (id: string) => projectsApi.removeResource(project!.id, id),
    onSuccess: () => { toast.success(t.states.success); setDeleteConfirm(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? t.states.error),
  })

  if (!myTeam) return (
    <div className="mt-6 text-center py-24 text-muted-foreground">{t.projectTab.joinTeamFirst}</div>
  )

  const isBlocked = myTeam.approvalStatus === 'REJECTED' || myTeam.approvalStatus === 'DISQUALIFIED'
  if (isBlocked) return (
    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-8 text-center space-y-2">
      <div className="text-4xl">❌</div>
      <h3 className="text-xl font-bold text-red-800">{t.projectTab.teamBlocked}</h3>
    </div>
  )

  if (isLoading) return <div className="py-24"><LoadingSpinner /></div>

  if (!project) {
    if (!isHackingActive) return (
      <div className="mt-6 space-y-4">
        {track && <TrackManual track={track} />}
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="font-semibold text-lg">{t.projectTab.noProject}</p>
          <p className="text-sm text-muted-foreground">{t.projectTab.noProjectDesc}</p>
        </div>
      </div>
    )

    return (
      <div className="mt-6 space-y-4">
        {track && <TrackManual track={track} />}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">{t.projectTab.newProject}</h3>
          </div>
          <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.projectTab.titleLabel}</label>
              <input {...register('title', { required: true })} placeholder={t.projectTab.titlePlaceholder}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.projectTab.descLabel}</label>
              <textarea {...register('description', { required: true })} rows={5}
                placeholder={t.projectTab.descPlaceholder}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background resize-none outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={createMut.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {createMut.isPending ? t.projectTab.creating : t.projectTab.createDraft}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const STATUS: Record<string, { icon: string; label: string; cls: string }> = {
    DRAFT:     { icon: '✏️', label: t.states.draft,       cls: 'border-amber-200 bg-amber-50 text-amber-900' },
    SUBMITTED: { icon: '✅', label: t.states.pending,     cls: 'border-blue-200 bg-blue-50 text-blue-900' },
    REVIEWED:  { icon: '👁️', label: t.dashboard.stages.REVIEW, cls: 'border-purple-200 bg-purple-50 text-purple-900' },
    APPROVED:  { icon: '🏆', label: t.states.approved,    cls: 'border-green-200 bg-green-50 text-green-900' },
    REJECTED:  { icon: '❌', label: t.states.rejected,    cls: 'border-red-200 bg-red-50 text-red-900' },
  }
  const st = STATUS[status] ?? STATUS.DRAFT

  return (
    <>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{t.projectTab.submitConfirmTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.projectTab.submitConfirmDesc}</p>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              {t.projectTab.submitWarning}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">{t.actions.cancel}</button>
              <button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {submitMut.isPending ? t.projectTab.submitting : t.projectTab.confirmSubmitBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {track && <TrackManual track={track} />}

        {/* Status banner */}
        <div className={`rounded-xl border p-4 ${st.cls}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-bold flex items-center gap-2">{st.icon} {st.label}</p>
              {status === 'DRAFT' && isHackingActive && hackingEndDate && (
                <p className="text-xs flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {t.projectTab.timeRemaining} <Countdown endDate={hackingEndDate!} />
                </p>
              )}
              {status === 'SUBMITTED' && project.submittedAt && (
                <p className="text-xs">{t.projectTab.submittedAt} {formatDateTime(project.submittedAt)}
                  {project.isLate && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium"><AlertTriangle className="h-3 w-3" /> {t.projectTab.lateBy.replace('{minutes}', String(project.submittedLateByMinutes))}</span>}
                </p>
              )}
              {status === 'REJECTED' && project.comment && (
                <p className="text-xs">{t.projectTab.commentLabel} &quot;{project.comment}&quot;</p>
              )}
            </div>
            {status === 'DRAFT' && !isEditing && (
              <button onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 rounded-lg border border-current px-3 py-1.5 text-xs font-medium hover:opacity-80">
                <Pencil className="h-3.5 w-3.5" /> {t.projectTab.editBtn}
              </button>
            )}
            {status === 'REJECTED' && (
              <button onClick={() => reopenMut.mutate()} disabled={reopenMut.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-red-400 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">
                <RotateCcw className="h-3.5 w-3.5" /> {reopenMut.isPending ? t.projectTab.reopening : t.projectTab.reopenBtn}
              </button>
            )}
          </div>
        </div>

        {/* Project card */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {isEditing ? (
            <form onSubmit={handleSubmit(d => updateMut.mutate(d))}>
              <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <h3 className="font-semibold">{t.projectTab.editing}</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditMode(false); reset() }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">{t.actions.cancel}</button>
                  <button type="submit" disabled={updateMut.isPending}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {updateMut.isPending ? t.projectTab.saving : t.actions.save}
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.projectTab.titleLabel}</label>
                  <input {...register('title', { required: true })} className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.projectTab.descLabel}</label>
                  <textarea {...register('description')} rows={6} className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background resize-none outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                </div>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-3">
              <h2 className="text-xl font-bold">{project.title || <span className="text-muted-foreground italic text-base">{t.projectTab.titleNotSpecified}</span>}</h2>
              {project.description
                ? <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{project.description}</p>
                : <p className="text-sm text-muted-foreground/60 italic">{t.projectTab.descNotSpecified}</p>}
            </div>
          )}
        </div>

        {/* Resources */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4 text-primary" /> {t.projectTab.resourcesTitle}</h3>
            {(status === 'DRAFT' || status === 'REJECTED') && !showResForm && (
              <button onClick={() => setShowResForm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80">
                <Plus className="h-3.5 w-3.5" /> {t.projectTab.addResourceBtn}
              </button>
            )}
          </div>

          {resources.length === 0 && !showResForm && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{t.projectTab.noResourcesDesc}</p>
            </div>
          )}

          <div className="space-y-2">
            {resources.map((res: any) => (
              <div key={res.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-lg shrink-0">{TYPE_ICONS[(res.type?.name ?? '')] ?? '🔗'}</span>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{res.type?.name ?? t.projectTab.resourceLabel}</p>
                    {res.description && <p className="text-xs text-muted-foreground truncate">{res.description}</p>}
                    <a href={res.url} target="_blank" rel="noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 truncate">
                      {res.url} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>
                {(status === 'DRAFT' || status === 'REJECTED') && (
                  deleteConfirm === res.id ? (
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground">{t.projectTab.deleteConfirm}</span>
                      <button onClick={() => delResMut.mutate(res.id)} className="text-xs text-destructive font-medium px-1.5 hover:underline">{t.actions.yes}</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground px-1.5 hover:underline">{t.actions.no}</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(res.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-md shrink-0 ml-2 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )
                )}
              </div>
            ))}
          </div>

          {showResForm && (
            <div className="mt-4 rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t.projectTab.newResourceTitle}</p>
                <button onClick={() => { setShowResForm(false); resForm.reset() }} className="p-1 hover:text-destructive"><X className="h-4 w-4" /></button>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t.projectTab.resourceTypeLabel}</label>
                <select {...resForm.register('projectTypeId', { required: true })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background outline-none focus:border-ring">
                  <option value="">{t.projectTab.selectTypePlaceholder}</option>
                  {resourceTypes.map((t: any) => (
                    <option key={t.id} value={t.id}>{TYPE_ICONS[t.name] ?? '🔗'} {t.description ?? t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t.projectTab.urlLabel}</label>
                <input {...resForm.register('url', { required: true })} placeholder="https://..."
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background outline-none focus:border-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t.projectTab.optionalDescLabel}</label>
                <input {...resForm.register('description')} placeholder={t.projectTab.optionalDescPlaceholder}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background outline-none focus:border-ring" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowResForm(false); resForm.reset() }}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">{t.actions.cancel}</button>
                <button type="button" disabled={addResMut.isPending || !resUrl}
                  onClick={() => resForm.handleSubmit(d => addResMut.mutate(d))()}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {addResMut.isPending ? t.projectTab.addingResource : <><Plus className="h-4 w-4" /> {t.projectTab.addResourceBtn}</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit section */}
        {status === 'DRAFT' && (
          <div className={`rounded-xl border p-5 space-y-3 ${canSubmit ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20'}`}>
            {!canSubmit && (
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /> {t.projectTab.validationTitle}</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 ml-6 list-disc">
                  {!titleVal.trim() && <li>{t.projectTab.titleLabel.replace(' *', '')}</li>}
                </ul>
              </div>
            )}
            {canSubmit && (
              <div>
                <p className="text-sm font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> {t.projectTab.submitPrompt}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.projectTab.submitBannerDesc}</p>
              </div>
            )}
            <button onClick={() => setShowConfirm(true)} disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <Send className="h-4 w-4" /> {t.projectTab.submitBtn}
            </button>
          </div>
        )}

        {status === 'SUBMITTED' && (
          <p className="text-xs text-muted-foreground text-center">{t.projectTab.submittedSuccessFooter}</p>
        )}
      </div>
    </>
  )
}
