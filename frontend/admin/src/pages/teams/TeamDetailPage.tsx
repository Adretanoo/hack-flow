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
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react'
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

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={clsx('border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {label}
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

      {/* Approval tab */}
      {activeTab === 'approval' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h4 className="font-semibold">Змінити рішення</h4>
            <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)} className={inputCls}>
              <option value="APPROVED">Схвалено</option>
              <option value="REJECTED">Відхилено</option>
              <option value="DISQUALIFIED">Дискваліфіковано</option>
              <option value="PENDING">Очікує</option>
            </select>
            <textarea rows={3} value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="Коментар (обов'язковий для REJECTED/DISQUALIFIED)"
              className={inputCls + ' resize-none'} />
            <button onClick={() => approvalMut.mutate()} disabled={approvalMut.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
              Зберегти рішення
            </button>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Історія</h4>
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
