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
import { ArrowLeft, ExternalLink, Trash2, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import type { Team, TeamMember, TeamApproval, Project } from '@/types/api.types'

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
  const projects = (projectData?.data.data ?? []) as Project[]
  const project = projects[0] ?? null

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
        <div>
          {!project ? (
            <EmptyState title="Проєкт не подано" description="Команда ще не подала проєкт на цей хакатон." />
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <StatusBadge status={project.status} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Подано</p><p>{project.submittedAt ? formatDateTime(project.submittedAt) : '—'}</p></div>
                  <div><p className="text-muted-foreground">Переглянуто</p><p>{project.reviewedAt ? formatDateTime(project.reviewedAt) : '—'}</p></div>
                </div>
                {project.comment && <p className="rounded-lg bg-muted/30 px-3 py-2 text-sm">{project.comment}</p>}
                {project.resources && project.resources.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Ресурси</p>
                    <div className="space-y-1.5">
                      {project.resources.map((r) => (
                        <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium">{r.type}</span>
                          {r.description && <span className="text-muted-foreground">· {r.description}</span>}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {project.status === 'SUBMITTED' && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
                  <h4 className="font-semibold">Рецензія</h4>
                  <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className={inputCls}>
                    <option value="APPROVED">Схвалено</option>
                    <option value="REJECTED">Відхилено</option>
                  </select>
                  <textarea rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Коментар (необов'язково)" className={inputCls + ' resize-none'} />
                  <button onClick={() => reviewMut.mutate(project.id)} disabled={reviewMut.isPending}
                    className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                    Надіслати рецензію
                  </button>
                </div>
              )}
            </div>
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
