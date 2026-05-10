import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsApi } from '@/api/teams'
import { projectsApi } from '@/api/projects'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ApprovalTimeline } from '@/components/shared/ApprovalTimeline'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate, formatDateTime } from '@/utils/format'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink, Trash2, AlertCircle, AlertTriangle, Link as LinkIcon } from 'lucide-react'
import { clsx } from 'clsx'
import type { Team, TeamMember, TeamApproval } from '@/types/api.types'

type Tab = 'members' | 'project' | 'approval' | 'invites'
const TABS: { key: Tab; label: string }[] = [
  { key: 'members',  label: 'Учасники' },
  { key: 'project',  label: 'Проєкт' },
  { key: 'approval', label: 'Затвердження' },
  { key: 'invites',  label: 'Інвайти' },
]

const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors'

import { usePageTitle } from '@/hooks/usePageTitle'

export function TeamDetailPage() {
  usePageTitle('Команда')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('members')
  const [removeMemberTarget, setRemoveMemberTarget] = useState<string | null>(null)
  const [approvalStatus, setApprovalStatus] = useState('APPROVED')
  const [approvalComment, setApprovalComment] = useState('')
  const [reviewStatus, setReviewStatus] = useState('APPROVED')
  const [reviewComment, setReviewComment] = useState('')
  const [selectedTrackId, setSelectedTrackId] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(id!),
    enabled: !!id,
  })

  const { data: membersData } = useQuery({
    queryKey: ['team-members', id],
    queryFn: () => teamsApi.getMembers(id!),
    enabled: !!id,
  })

  const { data: projectData } = useQuery({
    queryKey: ['team-project', id],
    queryFn: () => projectsApi.listByTeam(id!),
    enabled: activeTab === 'project' && !!id,
  })

  // Fetch full project details (with embedded resources)
  const project = ((projectData?.data.data ?? []) as any[])[0] ?? null

  const { data: projectDetailData } = useQuery({
    queryKey: ['admin-project-detail', project?.id],
    queryFn: () => projectsApi.getById(project!.id).then(r => r.data.data),
    enabled: !!project?.id,
  })
  const fullProject: any = projectDetailData ?? project

  const removeMemberMut = useMutation({
    mutationFn: (userId: string) => teamsApi.removeMember(id!, userId),
    onSuccess: () => {
      toast.success('Учасника видалено')
      qc.invalidateQueries({ queryKey: ['team-members', id] })
      setRemoveMemberTarget(null)
    },
    onError: () => toast.error('Помилка при видаленні'),
  })

  const approvalMut = useMutation({
    mutationFn: () => teamsApi.updateApproval(id!, { status: approvalStatus, comment: approvalComment || undefined }),
    onSuccess: () => {
      toast.success('Рішення збережено')
      qc.invalidateQueries({ queryKey: ['team', id] })
      setApprovalComment('')
    },
    onError: () => toast.error('Помилка при збереженні'),
  })

  const reviewMut = useMutation({
    mutationFn: (projectId: string) => projectsApi.review(projectId, { status: reviewStatus, comment: reviewComment || undefined }),
    onSuccess: () => {
      toast.success('Рецензію збережено')
      qc.invalidateQueries({ queryKey: ['team-project', id] })
      qc.invalidateQueries({ queryKey: ['admin-project-detail', project?.id] })
      setShowReviewForm(false)
    },
    onError: () => toast.error('Помилка при рецензуванні'),
  })

  const changeTrackMut = useMutation({
    mutationFn: () => teamsApi.changeTrack(id!, selectedTrackId),
    onSuccess: () => {
      toast.success('Трек змінено')
      qc.invalidateQueries({ queryKey: ['team', id] })
      setSelectedTrackId('')
    },
    onError: () => toast.error('Помилка зміни треку'),
  })

  if (isLoading) return <LoadingSpinner className="py-20" />
  const team = teamData?.data.data as Team | undefined
  if (!team) return <div className="py-10 text-center text-muted-foreground">Команду не знайдено</div>

  const members = (membersData?.data.data ?? []) as TeamMember[]

  const approvals = (team as unknown as { approvals?: TeamApproval[] }).approvals ?? []

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/teams')}
          className="mt-1 rounded-lg border border-border p-2 hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {team.logo
            ? <img src={team.logo} className="h-12 w-12 rounded-xl object-cover border border-border" alt="" />
            : <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{team.name[0]}</div>
          }
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{team.name}</h2>
              <StatusBadge status={team.approvalStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {(team.hackathon as { title?: string } | undefined)?.title ?? '—'} &middot; {(team.track as { name?: string } | null)?.name ?? 'Без треку'}
            </p>
          </div>
        </div>
      </div>

      {/* ── PENDING alert banner ───────────────────────────────────── */}
      {team.approvalStatus === 'PENDING' && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Команда очікує затвердження</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Команда змінила назву, опис або трек — або подала нову заявку. Перейдіть на вкладку «Затвердження» щоб розглянути і ухвалити або відхилити.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('approval')}
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Затвердити
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={clsx('relative border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {label}
              {key === 'approval' && team.approvalStatus === 'PENDING' && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Учасник</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Роль</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Вступив</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Учасників ще немає</td></tr>
              ) : members.map((m) => (
                <tr key={m.id} className="bg-card hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {m.user?.avatarUrl
                        ? <img src={m.user.avatarUrl} className="h-7 w-7 rounded-full object-cover" alt="" />
                        : <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{m.user?.fullName?.[0]}</div>
                      }
                      <span className="font-medium">{m.user?.fullName ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.user?.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('rounded-full px-2 py-0.5 text-xs font-semibold',
                      m.role === 'captain' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground')}>
                      {m.role === 'captain' ? 'Капітан' : 'Учасник'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(m.joinedAt)}</td>
                  <td className="px-4 py-3">
                    {m.role !== 'captain' && (
                      <button onClick={() => setRemoveMemberTarget(m.userId)}
                        className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Project tab */}
      {activeTab === 'project' && (
        <div className="space-y-4">
          {!fullProject ? (
            <EmptyState title="Проєкт не подано" description="Команда ще не створила проєкт на цей хакатон." />
          ) : (
            <>
              {/* Header card */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{fullProject.title || <span className="text-muted-foreground italic">Без назви</span>}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={fullProject.status} />
                      {(fullProject.isLate || (fullProject.submittedLateByMinutes ?? 0) > 0) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-semibold">
                          <AlertTriangle className="h-3 w-3" /> Запізнення +{fullProject.submittedLateByMinutes} хв
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timestamps row */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Подано</p>
                    <p className="font-medium">{fullProject.submittedAt ? formatDateTime(fullProject.submittedAt) : '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Переглянуто</p>
                    <p className="font-medium">{fullProject.reviewedAt ? formatDateTime(fullProject.reviewedAt) : '—'}</p>
                  </div>
                </div>

                {/* Description */}
                {fullProject.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Опис</p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{fullProject.description}</p>
                  </div>
                )}

                {/* Review comment */}
                {fullProject.comment && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    <span className="font-semibold">Коментар: </span>{fullProject.comment}
                  </div>
                )}
              </div>

              {/* Resources */}
              {fullProject.resources && fullProject.resources.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <LinkIcon className="h-4 w-4 text-primary" /> Ресурси
                  </p>
                  <div className="space-y-2">
                    {fullProject.resources.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/10">
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{r.type?.name ?? r.projectTypeId}</p>
                          {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
                        </div>
                        <a href={r.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0 ml-4">
                          {new URL(r.url).hostname} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review form or already-reviewed banner */}
              {(fullProject.status === 'SUBMITTED' || showReviewForm) ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
                  <h4 className="font-semibold">Рішення по проєкту</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-accent">
                      <input type="radio" name="rs" value="APPROVED" checked={reviewStatus === 'APPROVED'}
                        onChange={() => setReviewStatus('APPROVED')} />
                      <span className="text-sm font-medium">✅ Схвалити проєкт</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-accent">
                      <input type="radio" name="rs" value="REJECTED" checked={reviewStatus === 'REJECTED'}
                        onChange={() => setReviewStatus('REJECTED')} />
                      <span className="text-sm font-medium">❌ Відхилити проєкт</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Коментар {reviewStatus === 'REJECTED' && <span className="text-destructive">*</span>}
                    </label>
                    <textarea rows={3} value={reviewComment} onChange={e => { setReviewComment(e.target.value); setReviewError('') }}
                      placeholder={reviewStatus === 'REJECTED' ? 'Вкажіть причину відхилення...' : 'Коментар (необовʼязково)'}
                      className={clsx(inputCls, 'resize-none', reviewError && 'border-destructive')} />
                    {reviewError && <p className="text-xs text-destructive mt-1">{reviewError}</p>}
                  </div>
                  <div className="flex gap-2">
                    {showReviewForm && fullProject.status !== 'SUBMITTED' && (
                      <button onClick={() => setShowReviewForm(false)}
                        className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Скасувати</button>
                    )}
                    <button
                      onClick={() => {
                        if (reviewStatus === 'REJECTED' && !reviewComment.trim()) {
                          setReviewError('Вкажіть причину відхилення')
                          return
                        }
                        reviewMut.mutate(fullProject.id)
                      }}
                      disabled={reviewMut.isPending}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                      {reviewMut.isPending ? 'Збереження...' : 'Зберегти рішення'}
                    </button>
                  </div>
                </div>
              ) : fullProject.status !== 'DRAFT' ? (
                <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">ℹ️ Проєкт вже переглянуто</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Статус: {fullProject.status}</p>
                  </div>
                  <button onClick={() => setShowReviewForm(true)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
                    Змінити рішення
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {activeTab === 'approval' && (
        <div className="space-y-5">

          {/* ── What changed (context for admin) ─────────────────── */}
          {team.approvalStatus === 'PENDING' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
              <p className="text-sm font-semibold text-amber-800">⏳ Команда очікує вашого рішення</p>
              <p className="text-xs text-amber-700">
                Команда подала нову заявку або змінила назву, опис або запитала зміну треку.
                Перевірте поточні дані команди і ухваліть або відхиліть зі зазначенням причини.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
                <div>
                  <p className="text-xs text-amber-600 font-medium mb-0.5">Назва</p>
                  <p className="font-semibold">{team.name}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-medium mb-0.5">Трек</p>
                  <p className="font-semibold">{(team.track as any)?.name ?? 'Без треку'}</p>
                </div>
                {(team as any).description && (
                  <div className="col-span-2">
                    <p className="text-xs text-amber-600 font-medium mb-0.5">Опис</p>
                    <p>{(team as any).description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Admin decision ───────────────────────────────────── */}
          {(team.approvalStatus === 'REJECTED' || team.approvalStatus === 'DISQUALIFIED') && (
            <div className={clsx(
              'rounded-xl border p-4 space-y-1',
              team.approvalStatus === 'REJECTED'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-orange-200 bg-orange-50 text-orange-800',
            )}>
              <p className="font-semibold text-sm">
                {team.approvalStatus === 'REJECTED' ? '⛔ Команду відхилено' : '🚫 Команду дискваліфіковано'}
              </p>
              {approvals[0]?.comment && (
                <p className="text-sm opacity-90">Причина: <span className="font-medium">{approvals[0].comment}</span></p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h4 className="font-semibold">Рішення організатора</h4>
            <p className="text-xs text-muted-foreground">Це рішення буде видимо команді в їхньому кабінеті.</p>
            <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)} className={inputCls}>
              <option value="APPROVED">Схвалити</option>
              <option value="PENDING">Повернути на розгляд</option>
              <option value="REJECTED">Відхилити</option>
              <option value="DISQUALIFIED">Дискваліфікувати</option>
            </select>

            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                {approvalStatus === 'REJECTED'
                  ? 'Причина відхилення — буде показана команді *'
                  : approvalStatus === 'DISQUALIFIED'
                    ? 'Причина дискваліфікації — буде показана команді *'
                  : approvalStatus === 'APPROVED'
                    ? 'Коментар для команди (необов’язково)'
                  : 'Коментар (необов’язково)'}
              </label>
              <textarea
                rows={3}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder={
                  approvalStatus === 'REJECTED'
                    ? 'Вкажіть причину — команда побачить цей текст у своєму кабінеті...'
                    : approvalStatus === 'DISQUALIFIED'
                      ? 'Вкажіть причину дискваліфікації — команда побачить цей текст у своєму кабінеті...'
                    : 'Необов’язковий коментар для команди...'
                }
                className={clsx(
                  inputCls + ' resize-none',
                  (approvalStatus === 'REJECTED' || approvalStatus === 'DISQUALIFIED') &&
                    !approvalComment.trim() && 'border-destructive focus:border-destructive focus:ring-destructive/20',
                )}
              />
              {(approvalStatus === 'REJECTED' || approvalStatus === 'DISQUALIFIED') && !approvalComment.trim() && (
                <p className="mt-1 text-xs text-destructive">Обов’язкове поле — команда побачить цю причину</p>
              )}
            </div>

            <button
              onClick={() => approvalMut.mutate()}
              disabled={
                approvalMut.isPending ||
                ((approvalStatus === 'REJECTED' || approvalStatus === 'DISQUALIFIED') && !approvalComment.trim())
              }
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {approvalMut.isPending ? 'Зберігаємо...' : 'Зберегти рішення'}
            </button>
          </div>

          {/* ── Admin track override ───────────────────────────────── */}
          {(() => {
            const hackathonTracks = ((team.hackathon as any)?.tracks ?? []) as Array<{ id: string; name: string }>
            const currentTrack = (team.track as { id?: string; name?: string } | null)
            if (hackathonTracks.length === 0) return null
            return (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div>
                  <h4 className="font-semibold">Трек команди</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Поточний трек: <span className="font-medium text-foreground">{currentTrack?.name ?? 'Без треку'}</span>.
                    {' '}Ця зміна не потребує затвердження — набуде чинною одразу.
                  </p>
                </div>
                {team.approvalStatus !== 'DISQUALIFIED' && (
                  <div className="flex gap-2">
                    <select
                      value={selectedTrackId}
                      onChange={(e) => setSelectedTrackId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— Оберіть новий трек —</option>
                      {hackathonTracks.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.id === currentTrack?.id}>
                          {t.name}{t.id === currentTrack?.id ? ' (поточний)' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => changeTrackMut.mutate()}
                      disabled={!selectedTrackId || selectedTrackId === currentTrack?.id || changeTrackMut.isPending}
                      className="shrink-0 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {changeTrackMut.isPending ? 'Зміна...' : 'Призначити трек'}
                    </button>
                  </div>
                )}
              </div>
            )
          })()}

          <div>
            <h4 className="mb-3 font-semibold">Історія рішень</h4>
            <ApprovalTimeline entries={approvals} />
          </div>
        </div>
      )}

      {/* Invites tab */}
      {activeTab === 'invites' && (
        <EmptyState title="Інвайти" description="Список активних посилань-запрошень для цієї команди." />
      )}

      <ConfirmDialog
        open={!!removeMemberTarget}
        title="Видалити учасника?"
        description="Учасника буде видалено з команди. Дія незворотна."
        confirmLabel="Видалити"
        onConfirm={() => removeMemberTarget && removeMemberMut.mutate(removeMemberTarget)}
        onCancel={() => setRemoveMemberTarget(null)}
      />
    </div>
  )
}
