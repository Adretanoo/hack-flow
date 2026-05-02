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
import { formatDate, getStatusLabel } from '@/utils/format'
import { toast } from 'sonner'
import { Pencil, ArrowLeft, Users, Trophy, Star, CheckCircle2, MapPin, Mail, ExternalLink, Image } from 'lucide-react'
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
    {
      key: 'status',
      header: 'Статус',
      render: (t) => (
        <select
          value={t.approvalStatus}
          onChange={(e) => approvalMut.mutate({ teamId: t.id, status: e.target.value as 'APPROVED' | 'REJECTED' | 'PENDING' | 'DISQUALIFIED' })}
          disabled={approvalMut.isPending}
          className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
          style={{
            backgroundColor: t.approvalStatus === 'APPROVED' ? 'var(--green-50, #f0fdf4)' : t.approvalStatus === 'REJECTED' ? 'var(--red-50, #fef2f2)' : t.approvalStatus === 'DISQUALIFIED' ? 'var(--neutral-100, #f5f5f5)' : 'var(--amber-50, #fffbeb)',
            color: t.approvalStatus === 'APPROVED' ? 'var(--green-700, #15803d)' : t.approvalStatus === 'REJECTED' ? 'var(--red-700, #b91c1c)' : t.approvalStatus === 'DISQUALIFIED' ? 'var(--neutral-600, #525252)' : 'var(--amber-700, #b45309)'
          }}
        >
          <option value="PENDING">Очікує</option>
          <option value="APPROVED">Схвалено</option>
          <option value="REJECTED">Відхилено</option>
          <option value="DISQUALIFIED">Дискваліфіковано</option>
        </select>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner */}
            <div className="rounded-xl overflow-hidden border border-border bg-card">
              {hackathon.banner ? (
                <img src={hackathon.banner} alt={hackathon.title} className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 bg-muted flex flex-col items-center justify-center text-muted-foreground">
                  <Image className="h-12 w-12 mb-3 opacity-20" />
                  <p>Обкладинка не додана</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Опис хакатону</h3>
              {hackathon.description ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
                  {hackathon.description}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Опис відсутній</p>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center">
                <Users className="h-5 w-5 text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{hackathon._count?.teams ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Команд</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center">
                <Trophy className="h-5 w-5 text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">{hackathon.tracks?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Треків</p>
              </div>
            </div>

            {/* Details Card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold">Деталі</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Location */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Локація</p>
                  <div className="flex items-start gap-2">
                    {hackathon.online && <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Online</span>}
                    <span className="text-sm">{hackathon.location || (hackathon.online ? 'Тільки онлайн' : 'Не вказано')}</span>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Дати проведення</p>
                  <p className="text-sm font-medium">{formatDate(hackathon.startDate)} — {formatDate(hackathon.endDate)}</p>
                </div>

                {/* Team Size */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Розмір команди</p>
                  <p className="text-sm">
                    {hackathon.minTeamSize && hackathon.maxTeamSize 
                      ? `Від ${hackathon.minTeamSize} до ${hackathon.maxTeamSize} учасників`
                      : hackathon.maxTeamSize ? `До ${hackathon.maxTeamSize} учасників`
                      : hackathon.minTeamSize ? `Від ${hackathon.minTeamSize} учасників`
                      : 'Не обмежено'}
                  </p>
                </div>

                {/* Contact */}
                {hackathon.contactEmail && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Контактний Email</p>
                    <a href={`mailto:${hackathon.contactEmail}`} className="text-sm text-primary hover:underline">{hackathon.contactEmail}</a>
                  </div>
                )}

                {/* Rules */}
                {hackathon.rulesUrl && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Правила</p>
                    <a href={hackathon.rulesUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">{hackathon.rulesUrl}</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <DataTable columns={teamColumns} data={teams} loading={teamsLoading}
          emptyTitle="Команд ще немає" emptyDescription="Жодна команда не зареєструвалась." />
      )}

      {activeTab === 'judges' && id && <JudgeTrackManager hackathonId={id} />}

      {activeTab === 'stages' && (
        <div className="space-y-4">
          <StagesSection hackathonId={hackathon.id} stages={hackathon.stages ?? []} hackathonStart={hackathon.startDate} hackathonEnd={hackathon.endDate} />

          {/* Manual status override */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="mb-3 font-semibold">Змінити статус вручну</h4>
            <div className="flex items-center gap-3">
              <select value={statusOverride || hackathon.status}
                onChange={(e) => setStatusOverride(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
                {STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
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
