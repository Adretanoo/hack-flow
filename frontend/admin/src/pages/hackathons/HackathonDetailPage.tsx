import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { teamsApi } from '@/api/teams'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { JudgeTrackManager } from '@/components/hackathons/JudgeTrackManager'
import { StagesSection } from './components/StagesSection'
import { formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { Pencil, ArrowLeft, Users, Trophy, Star, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { Team } from '@/types/api.types'
import type { Column } from '@/components/shared/DataTable'

type Tab = 'overview' | 'teams' | 'judges' | 'stages'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Огляд', icon: Trophy },
  { key: 'teams',    label: 'Команди', icon: Users },
  { key: 'judges',   label: 'Судді', icon: Star },
  { key: 'stages',   label: 'Стадії', icon: CheckCircle2 },
]

const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const

import { usePageTitle } from '@/hooks/usePageTitle'

export function HackathonDetailPage() {
  usePageTitle('Хакатон')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [statusOverride, setStatusOverride] = useState<string>('')
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false)

  const { data: hackData, isLoading } = useQuery({
    queryKey: ['hackathon', id],
    queryFn: () => hackathonsApi.getById(id!),
    enabled: !!id,
  })

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamsApi.list({ hackathon_id: id, limit: 50 }),
    enabled: activeTab === 'teams' && !!id,
  })

  const overrideMut = useMutation({
    mutationFn: () => hackathonsApi.overrideStatus(id!, statusOverride as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'),
    onSuccess: () => {
      toast.success('Статус оновлено')
      qc.invalidateQueries({ queryKey: ['hackathon', id] })
      qc.invalidateQueries({ queryKey: ['hackathons'] })
      setConfirmStatusOpen(false)
    },
    onError: () => toast.error('Помилка при зміні статусу'),
  })

  const approvalMut = useMutation({
    mutationFn: ({ teamId, status }: { teamId: string; status: string }) =>
      teamsApi.updateApproval(teamId, { status }),
    onSuccess: () => {
      toast.success('Статус команди оновлено')
      qc.invalidateQueries({ queryKey: ['teams', id] })
    },
    onError: () => toast.error('Помилка'),
  })

  if (isLoading) return <LoadingSpinner className="py-20" label="Завантаження…" />

  const hackathon = hackData?.data.data
  if (!hackathon) return <div className="py-10 text-center text-muted-foreground">Хакатон не знайдено</div>

  const teams: Team[] = (teamsData?.data.data ?? []) as Team[]

  const teamColumns: Column<Team>[] = [
    { key: 'name', header: 'Команда', render: (t) => <span className="font-medium">{t.name}</span> },
    { key: 'members', header: 'Учасники', render: (t) => <span className="text-muted-foreground">{t._count?.members ?? '—'}</span> },
    { key: 'status', header: 'Статус', render: (t) => <StatusBadge status={t.approvalStatus} /> },
    {
      key: 'actions',
      header: '',
      render: (t) => (
        <div className="flex gap-1">
          {t.approvalStatus === 'PENDING' && (
            <>
              <button onClick={() => approvalMut.mutate({ teamId: t.id, status: 'APPROVED' })}
                className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100 transition-colors">
                Схвалити
              </button>
              <button onClick={() => approvalMut.mutate({ teamId: t.id, status: 'REJECTED' })}
                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100 transition-colors">
                Відхилити
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/hackathons')}
          className="mt-1 rounded-lg border border-border p-2 hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold truncate">{hackathon.title}</h2>
            <StatusBadge status={hackathon.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(hackathon.startDate)} — {formatDate(hackathon.endDate)}
          </p>
        </div>
        <button onClick={() => navigate(`/hackathons/${id}/edit`)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors">
          <Pencil className="h-4 w-4" /> Редагувати
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={clsx(
                'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-3xl font-bold">{hackathon._count?.teams ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Команд зареєстровано</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-3xl font-bold">{hackathon._count?.projects ?? '—'}</p>
            <p className="text-sm text-muted-foreground mt-1">Проєктів подано</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-3xl font-bold">{hackathon.tracks?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Треків</p>
          </div>
          {hackathon.description && (
            <div className="col-span-3 rounded-xl border border-border bg-card p-5">
              <h4 className="mb-2 font-semibold">Опис</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{hackathon.description}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'teams' && (
        <DataTable columns={teamColumns} data={teams} loading={teamsLoading}
          emptyTitle="Команд ще немає" emptyDescription="Жодна команда не зареєструвалась." />
      )}

      {activeTab === 'judges' && id && <JudgeTrackManager hackathonId={id} />}

      {activeTab === 'stages' && (
        <div className="space-y-4">
          <StagesSection stages={hackathon.stages ?? []} hackathonStart={hackathon.startDate} hackathonEnd={hackathon.endDate} />

          {/* Manual status override */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="mb-3 font-semibold">Змінити статус вручну</h4>
            <div className="flex items-center gap-3">
              <select value={statusOverride || hackathon.status}
                onChange={(e) => setStatusOverride(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                disabled={!statusOverride || statusOverride === hackathon.status}
                onClick={() => setConfirmStatusOpen(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                Змінити статус
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmStatusOpen}
        title="Змінити статус?"
        description={`Статус буде змінено на "${statusOverride}". Продовжити?`}
        confirmLabel="Змінити"
        danger={false}
        onConfirm={() => overrideMut.mutate()}
        onCancel={() => setConfirmStatusOpen(false)}
      />
    </div>
  )
}
