import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { teamsApi } from '@/api/teams'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { JudgeTrackManager } from '@/components/hackathons/JudgeTrackManager'
import { MentorManager } from '@/components/hackathons/MentorManager'
import { StagesSection } from './components/StagesSection'
import { ResultsPanel } from './components/ResultsPanel'
import { formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { Pencil, ArrowLeft, Users, Trophy, Star, BookOpen, CheckCircle2, MapPin, Mail, ExternalLink, Image, BarChart2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useI18n } from '@/i18n'
import type { Team } from '@/types/api.types'
import type { Column } from '@/components/shared/DataTable'

type Tab = 'overview' | 'teams' | 'judges' | 'mentors' | 'stages' | 'results'

const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const

import { usePageTitle } from '@/hooks/usePageTitle'

export function HackathonDetailPage() {
  const { t, lang } = useI18n()
  usePageTitle(t.adminNav.hackathons)
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [statusOverride, setStatusOverride] = useState<string>('')
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false)
  // Local optimistic overrides: teamId -> new status shown immediately in SELECT
  const [teamStatusOverrides, setTeamStatusOverrides] = useState<Record<string, string>>({})

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = useMemo(() => [
    { key: 'overview', label: lang === 'uk' ? 'Огляд' : 'Overview', icon: Trophy },
    { key: 'teams',    label: t.adminNav.teams, icon: Users },
    { key: 'judges',   label: t.adminJudging.judges, icon: Star },
    { key: 'mentors',  label: t.adminMentorship.mentors, icon: BookOpen },
    { key: 'stages',   label: lang === 'uk' ? 'Стадії' : 'Stages', icon: CheckCircle2 },
    { key: 'results',  label: lang === 'uk' ? 'Результати' : 'Results', icon: BarChart2 },
  ], [lang, t])

  const { data: hackData, isLoading } = useQuery({
    queryKey: ['hackathon', id],
    queryFn: () => hackathonsApi.getById(id!),
    enabled: !!id,
  })

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamsApi.list({ hackathon_id: id, limit: 50 }),
    enabled: activeTab === 'teams' && !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const overrideMut = useMutation({
    mutationFn: () => hackathonsApi.overrideStatus(id!, statusOverride as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'),
    onSuccess: () => {
      toast.success(lang === 'uk' ? 'Статус оновлено' : 'Status updated')
      qc.invalidateQueries({ queryKey: ['hackathon', id] })
      qc.invalidateQueries({ queryKey: ['hackathons'] })
      qc.invalidateQueries({ queryKey: ['hackathons', 'all'] })
      setConfirmStatusOpen(false)
    },
    onError: (err: any) => {
      setConfirmStatusOpen(false)
      const backendMsg: string = err?.response?.data?.message ?? ''
      let msg: string
      if (backendMsg.toLowerCase().includes('stage')) {
        msg = lang === 'uk'
          ? '❌ Неможливо опублікувати — спочатку додайте хоча б одну стадію (вкладка «Стадії»)'
          : '❌ Cannot publish — please add at least one stage first (Stages tab)'
      } else if (backendMsg) {
        msg = backendMsg
      } else {
        msg = lang === 'uk' ? 'Помилка при зміні статусу' : 'Error changing status'
      }
      toast.error(msg)
    },
  })

  const approvalMut = useMutation({
    mutationFn: ({ teamId, status }: { teamId: string; status: string }) =>
      teamsApi.updateApproval(teamId, { status }),

    onError: (_err, vars) => {
      // Revert the local override on failure
      setTeamStatusOverrides(prev => { const n = { ...prev }; delete n[vars.teamId]; return n })
      toast.error(lang === 'uk' ? 'Помилка' : 'Error')
    },

    onSuccess: async (_data, vars) => {
      toast.success(lang === 'uk' ? 'Статус команди оновлено' : 'Team status updated')
      // Refetch first, THEN clear override — so the UI never falls back to stale server data
      // while the network round-trip is in flight.
      await qc.refetchQueries({ queryKey: ['teams', id] })
      setTeamStatusOverrides(prev => { const n = { ...prev }; delete n[vars.teamId]; return n })
      qc.invalidateQueries({ queryKey: ['full-results'] })
    },
  })

  if (isLoading) return <LoadingSpinner className="py-20" label={lang === 'uk' ? 'Завантаження…' : 'Loading...'} />

  const hackathon = hackData?.data.data
  if (!hackathon) return <div className="py-10 text-center text-muted-foreground">{lang === 'uk' ? 'Хакатон не знайдено' : 'Hackathon not found'}</div>

  const teams: Team[] = (teamsData?.data.data ?? []) as Team[]

  const teamColumns: Column<Team>[] = [
    { key: 'name', header: t.adminDashboardPage.team, render: (teamItem) => <span className="font-medium">{teamItem.name}</span> },
    { key: 'members', header: t.adminTeams.members, render: (teamItem) => <span className="text-muted-foreground">{teamItem._count?.members ?? '—'}</span> },
    {
      key: 'status',
      header: t.adminTeams.status,
      render: (teamItem) => (
        <select
          value={teamStatusOverrides[teamItem.id] ?? teamItem.approvalStatus}
          onChange={(e) => {
            const newStatus = e.target.value as 'APPROVED' | 'REJECTED' | 'PENDING' | 'DISQUALIFIED'
            setTeamStatusOverrides(prev => ({ ...prev, [teamItem.id]: newStatus }))
            approvalMut.mutate({ teamId: teamItem.id, status: newStatus })
          }}
          disabled={false}
          className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
          style={{
            backgroundColor: (teamStatusOverrides[teamItem.id] ?? teamItem.approvalStatus) === 'APPROVED' ? 'var(--green-50, #f0fdf4)' : (teamStatusOverrides[teamItem.id] ?? teamItem.approvalStatus) === 'REJECTED' ? 'var(--red-50, #fef2f2)' : (teamStatusOverrides[teamItem.id] ?? teamItem.approvalStatus) === 'DISQUALIFIED' ? 'var(--neutral-100, #f5f5f5)' : 'var(--amber-50, #fffbeb)',
            color: (teamStatusOverrides[teamItem.id] ?? teamItem.approvalStatus) === 'APPROVED' ? 'var(--green-700, #15803d)' : (teamStatusOverrides[teamItem.id] ?? teamItem.approvalStatus) === 'REJECTED' ? 'var(--red-700, #b91c1c)' : (teamStatusOverrides[teamItem.id] ?? teamItem.approvalStatus) === 'DISQUALIFIED' ? 'var(--neutral-600, #525252)' : 'var(--amber-700, #b45309)'
          }}
        >
          <option value="PENDING">{t.states.pending}</option>
          <option value="APPROVED">{t.states.approved}</option>
          <option value="REJECTED">{t.states.rejected}</option>
          <option value="DISQUALIFIED">{t.states.disqualified}</option>
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
          <Pencil className="h-4 w-4" /> {t.actions.edit}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto scrollbar-hide">
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
                  <p>{lang === 'uk' ? 'Обкладинка не додана' : 'Banner not added'}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">{lang === 'uk' ? 'Опис хакатону' : 'Hackathon Description'}</h3>
              {hackathon.description ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
                  {hackathon.description}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{lang === 'uk' ? 'Опис відсутній' : 'Description missing'}</p>
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
                <p className="text-xs text-muted-foreground mt-1">{lang === 'uk' ? 'Команд' : 'Teams'}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center">
                <Trophy className="h-5 w-5 text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">{hackathon.tracks?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{lang === 'uk' ? 'Треків' : 'Tracks'}</p>
              </div>
            </div>

            {/* Details Card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold">{lang === 'uk' ? 'Деталі' : 'Details'}</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Location */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {lang === 'uk' ? 'Локація' : 'Location'}</p>
                  <div className="flex items-start gap-2">
                    {hackathon.online && <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Online</span>}
                    <span className="text-sm">{hackathon.location || (hackathon.online ? (lang === 'uk' ? 'Тільки онлайн' : 'Online only') : t.adminDashboardPage.notSpecified)}</span>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{lang === 'uk' ? 'Дати проведення' : 'Dates'}</p>
                  <p className="text-sm font-medium">{formatDate(hackathon.startDate, lang)} — {formatDate(hackathon.endDate, lang)}</p>
                </div>

                {/* Team Size */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {lang === 'uk' ? 'Розмір команди' : 'Team Size'}</p>
                  <p className="text-sm">
                    {hackathon.minTeamSize && hackathon.maxTeamSize 
                      ? (lang === 'uk' ? `Від ${hackathon.minTeamSize} до ${hackathon.maxTeamSize} учасників` : `From ${hackathon.minTeamSize} to ${hackathon.maxTeamSize} members`)
                      : hackathon.maxTeamSize ? (lang === 'uk' ? `До ${hackathon.maxTeamSize} учасників` : `Up to ${hackathon.maxTeamSize} members`)
                      : hackathon.minTeamSize ? (lang === 'uk' ? `Від ${hackathon.minTeamSize} учасників` : `From ${hackathon.minTeamSize} members`)
                      : (lang === 'uk' ? 'Не обмежено' : 'Unlimited')}
                  </p>
                </div>

                {/* Contact */}
                {hackathon.contactEmail && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {lang === 'uk' ? 'Контактний Email' : 'Contact Email'}</p>
                    <a href={`mailto:${hackathon.contactEmail}`} className="text-sm text-primary hover:underline">{hackathon.contactEmail}</a>
                  </div>
                )}

                {/* Rules */}
                {hackathon.rulesUrl && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> {lang === 'uk' ? 'Правила' : 'Rules'}</p>
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
          emptyTitle={t.adminTeams.noTeams} emptyDescription={lang === 'uk' ? 'Жодна команда не зареєструвалась.' : 'No teams have registered yet.'} />
      )}

      {activeTab === 'judges' && id && <JudgeTrackManager hackathonId={id} />}

      {activeTab === 'mentors' && id && <MentorManager hackathonId={id} />}

      {activeTab === 'stages' && (
        <div className="space-y-4">
          <StagesSection hackathonId={hackathon.id} stages={hackathon.stages ?? []} hackathonStart={hackathon.startDate} hackathonEnd={hackathon.endDate} />

          {/* Manual status override */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="mb-3 font-semibold">{lang === 'uk' ? 'Змінити статус вручну' : 'Change status manually'}</h4>
            <div className="flex items-center gap-3">
              <select value={statusOverride || hackathon.status}
                onChange={(e) => setStatusOverride(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'DRAFT' ? (t.states.draft || 'Draft') : s === 'PUBLISHED' ? (t.states.published || 'Published') : (lang === 'uk' ? 'Архів' : 'Archive')}
                  </option>
                ))}
              </select>
              <button
                disabled={!statusOverride || statusOverride === hackathon.status}
                onClick={() => setConfirmStatusOpen(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {lang === 'uk' ? 'Змінити статус' : 'Change status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'results' && id && <ResultsPanel hackathonId={id} />}

      <ConfirmDialog
        open={confirmStatusOpen}
        title={lang === 'uk' ? "Змінити статус?" : "Change status?"}
        description={lang === 'uk' ? `Статус буде змінено на "${statusOverride === 'DRAFT' ? 'Чернетка' : statusOverride === 'PUBLISHED' ? 'Опубліковано' : 'Архів'}". Продовжити?` : `Status will be changed to "${statusOverride}". Continue?`}
        confirmLabel={lang === 'uk' ? "Змінити" : "Change"}
        danger={false}
        onConfirm={() => overrideMut.mutate()}
        onCancel={() => setConfirmStatusOpen(false)}
      />
    </div>
  )
}
