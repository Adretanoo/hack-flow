import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { judgingApi } from '@/api/judging'
import { hackathonsApi } from '@/api/hackathons'
import { judgeTrackApi } from '@/api/judgeTrack'
import { teamsApi } from '@/api/teams'
import { exportToCSV } from '@/utils/export'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataTable } from '@/components/shared/DataTable'
import { useClientPagination } from '@/hooks/useClientPagination'
import { ScoreDetailDrawer } from './components/ScoreDetailDrawer'
import { formatDate } from '@/utils/format'
import { ArrowLeft, Plus, Download, AlertTriangle, RefreshCcw, Trash2, Pencil, Check, X as XIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useI18n } from '@/i18n'
import type { Track, Criteria, LeaderboardEntry, Conflict } from '@/types/api.types'

type Tab = 'criteria' | 'scores' | 'conflicts' | 'leaderboard'

export function JudgingPage() {
  const { t, lang } = useI18n()
  usePageTitle(t.adminJudging.title)
  const { hackathonId } = useParams<{ hackathonId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const TABS: { key: Tab; label: string }[] = useMemo(() => [
    { key: 'criteria', label: t.adminDashboardPage.criteriaTab },
    { key: 'scores', label: t.adminJudging.scores },
    { key: 'conflicts', label: t.adminDashboardPage.conflictsTab },
    { key: 'leaderboard', label: t.adminDashboardPage.leaderboard },
  ], [t])

  const [activeTab, setActiveTab] = useState<Tab>('criteria')
  const [searchParams] = useSearchParams()

  // Auto-switch to tab specified in URL query param (e.g. ?tab=conflicts)
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && TABS.some(t => t.key === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  
  // Criteria form state per track
  const [newCriteria, setNewCriteria] = useState<{ trackId: string; name: string; maxScore: number; weight: number }>({
    trackId: '', name: '', maxScore: 10, weight: 0.1
  })

  // Hackathons data
  const { data: hackData } = useQuery({
    queryKey: ['hackathons', 'all'],
    queryFn: () => hackathonsApi.list({ limit: 100 }),
  })

  // Judging specific data
  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => hackathonsApi.listTracks(hackathonId!),
    enabled: !!hackathonId,
  })

  const { data: leaderboardData, isLoading: boardLoading, isFetching: boardFetching } = useQuery({
    queryKey: ['leaderboard', hackathonId],
    queryFn: () => judgingApi.getLeaderboard(hackathonId!),
    enabled: !!hackathonId && (activeTab === 'leaderboard' || activeTab === 'scores'),
  })

  const { data: conflictsData, isLoading: conflictsLoading } = useQuery({
    queryKey: ['conflicts', hackathonId],
    queryFn: () => judgingApi.listAllConflicts({ hackathonId, limit: 100 }),
    enabled: !!hackathonId,
  })

  const createCriteriaMut = useMutation({
    mutationFn: (data: Parameters<typeof judgingApi.createCriteria>[0]) => judgingApi.createCriteria(data),
    onSuccess: (_, variables) => {
      toast.success(lang === 'uk' ? 'Критерій додано' : 'Criterion added')
      qc.invalidateQueries({ queryKey: ['criteria', variables.trackId] })
      setNewCriteria({ trackId: '', name: '', maxScore: 10, weight: 0.1 })
    },
  })

  const deleteCriteriaMut = useMutation({
    mutationFn: ({ id }: { id: string; trackId: string }) => judgingApi.deleteCriteria(id),
    onSuccess: (_, vars) => {
      toast.success(lang === 'uk' ? 'Критерій видалено' : 'Criterion deleted')
      qc.invalidateQueries({ queryKey: ['criteria', vars.trackId] })
    },
  })

  const updateCriteriaMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any; trackId: string }) => judgingApi.updateCriteria(id, data),
    onSuccess: (_, vars) => {
      toast.success(lang === 'uk' ? 'Критерій оновлено' : 'Criterion updated')
      qc.invalidateQueries({ queryKey: ['criteria', vars.trackId] })
    },
  })

  // Conflicts CRUD state
  const [showCreateConflict, setShowCreateConflict] = useState(false)
  const [newConflict, setNewConflict] = useState({ judgeId: '', teamId: '', reason: 'MENTORED' as 'MENTORED' | 'RELATIVE' })
  const [editConflictId, setEditConflictId] = useState<string | null>(null)
  const [editConflictReason, setEditConflictReason] = useState<'MENTORED' | 'RELATIVE'>('MENTORED')

  // Load judges assigned to this hackathon (not all judges globally)
  const { data: judgeAssignmentsData } = useQuery({
    queryKey: ['judge-assignments', hackathonId],
    queryFn: () => judgeTrackApi.list(hackathonId!),
    enabled: !!hackathonId,
  })

  const { data: teamsForConflict } = useQuery({
    queryKey: ['teams-for-conflict', hackathonId],
    queryFn: () => teamsApi.list({ hackathon_id: hackathonId, limit: 100 }),
    enabled: !!hackathonId,
  })

  const createConflictMut = useMutation({
    mutationFn: () => judgingApi.adminCreateConflict({ judgeId: newConflict.judgeId, teamId: newConflict.teamId, reason: newConflict.reason }),
    onSuccess: () => { 
      toast.success(lang === 'uk' ? 'Конфлікт додано' : 'Conflict added')
      qc.invalidateQueries({ queryKey: ['conflicts', hackathonId] })
      setNewConflict({ judgeId: '', teamId: '', reason: 'MENTORED' })
      setShowCreateConflict(false) 
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка створення конфлікту' : 'Error creating conflict'),
  })

  const deleteConflictMut = useMutation({
    mutationFn: (id: string) => judgingApi.adminDeleteConflict(id),
    onSuccess: () => { 
      toast.success(lang === 'uk' ? 'Конфлікт видалено' : 'Conflict deleted')
      qc.invalidateQueries({ queryKey: ['conflicts', hackathonId] }) 
    },
  })

  const updateConflictMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: 'MENTORED' | 'RELATIVE' }) => judgingApi.adminUpdateConflict(id, reason),
    onSuccess: () => { 
      toast.success(lang === 'uk' ? 'Причину оновлено' : 'Reason updated')
      qc.invalidateQueries({ queryKey: ['conflicts', hackathonId] })
      setEditConflictId(null) 
    },
  })

  const tracks = (tracksData?.data.data ?? []) as Track[]
  const leaderboard = (leaderboardData?.data.data ?? []) as LeaderboardEntry[]
  const conflicts = ((conflictsData?.data as any)?.data ?? []) as Conflict[]

  const scoresPagination = useClientPagination(leaderboard, 20)
  const leaderboardPagination = useClientPagination(leaderboard, 20)

  // Build unique judges list from track assignments
  const judgeAssignments = (judgeAssignmentsData?.data?.data ?? []) as any[]
  const judges = useMemo(() => {
    const map = new Map<string, any>()
    judgeAssignments.forEach((a: any) => {
      if (!map.has(a.userId) && a.user) map.set(a.userId, { id: a.userId, ...a.user })
    })
    return Array.from(map.values())
  }, [judgeAssignments])

  // Teams filtered by selected judge's track(s)
  const allHackathonTeams = ((teamsForConflict?.data as any)?.data ?? []) as any[]
  const teamsForSelect = useMemo(() => {
    if (!newConflict.judgeId) return allHackathonTeams
    const trackIds = judgeAssignments
      .filter((a: any) => a.userId === newConflict.judgeId)
      .map((a: any) => a.trackId)
    if (trackIds.length === 0) return allHackathonTeams
    return allHackathonTeams.filter((t: any) => trackIds.includes(t.trackId))
  }, [allHackathonTeams, newConflict.judgeId, judgeAssignments])

  const hackathons = hackData?.data.data ?? []

  if (!hackathonId) {
    return (
      <div className="mx-auto max-w-xl py-20 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t.adminJudging.title}</h2>
          <p className="text-muted-foreground">{t.adminJudging.selectHackathon}</p>
        </div>
        <div className="grid gap-3">
          {hackathons.map((h) => (
            <button key={h.id} onClick={() => navigate(`/judging/${h.id}`)}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left hover:border-primary/50 transition-colors">
              <div>
                <h3 className="font-semibold">{h.title}</h3>
                <p className="text-sm text-muted-foreground">{formatDate(h.startDate)}</p>
              </div>
              <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  const handleExportConflicts = () => {
    const rows = conflicts.map(c => ({
      [lang === 'uk' ? 'Суддя' : 'Judge']: c.judge?.fullName || c.judgeId,
      [lang === 'uk' ? 'Email Судді' : 'Judge Email']: c.judge?.email || '',
      [lang === 'uk' ? 'Команда' : 'Team']: c.team?.name || c.teamId,
      [lang === 'uk' ? 'Причина' : 'Reason']: c.reason || '',
      [lang === 'uk' ? 'Дата' : 'Date']: formatDate(c.createdAt)
    }))
    exportToCSV(`conflicts_${hackathonId}_${new Date().toISOString().split('T')[0]}.csv`, rows)
  }

  const handleExportLeaderboard = () => {
    const rows = leaderboard.map(l => ({
      [lang === 'uk' ? 'Місце' : 'Rank']: l.rank,
      [lang === 'uk' ? 'Команда' : 'Team']: l.teamName,
      [lang === 'uk' ? 'Бали' : 'Score']: l.totalScore
    }))
    exportToCSV(`leaderboard_${hackathonId}_${new Date().toISOString().split('T')[0]}.csv`, rows)
  }

  return (
    <div className="space-y-5 animate-fade-in relative">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/judging')}
          className="rounded-lg border border-border p-2 hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">
            {lang === 'uk' ? 'Суддівство хакатону' : 'Hackathon Judging'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lang === 'uk' ? 'Управління критеріями, оцінками та лідбордом' : 'Manage criteria, scores, and leaderboard'}
          </p>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={clsx('border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'criteria' && (
        <div className="space-y-4">
          {tracks.length === 0 ? (
            <EmptyState title="Немає треків" description="Створіть треки в налаштуваннях хакатону." />
          ) : (
            tracks.map(track => (
              <TrackCriteriaSection 
                key={track.id} 
                track={track} 
                newCriteria={newCriteria}
                setNewCriteria={setNewCriteria}
                onCreate={(data) => createCriteriaMut.mutate(data)}
                onDelete={(id) => deleteCriteriaMut.mutate({ id, trackId: track.id })}
                onUpdate={(id, data) => updateCriteriaMut.mutate({ id, data, trackId: track.id })}
                isLoading={createCriteriaMut.isPending || deleteCriteriaMut.isPending || updateCriteriaMut.isPending}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'scores' && (
        <div className="space-y-3">
          <DataTable
            columns={[
              { key: 'team', header: lang === 'uk' ? 'Команда (Проєкт)' : 'Team (Project)', render: (l) => <span className="font-medium">{l.teamName}</span> },
              { key: 'actions', header: '', className: 'text-right', render: (l) => (
                <button onClick={() => setSelectedProjectId(l.projectId)} className="rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/20 transition-colors">
                  {t.adminDashboardPage.stats}
                </button>
              )}
            ]}
            data={scoresPagination.slice}
            total={scoresPagination.total}
            page={scoresPagination.page}
            limit={scoresPagination.limit}
            onPageChange={scoresPagination.setPage}
            onLimitChange={scoresPagination.setLimit}
            loading={boardLoading}
            emptyTitle={lang === 'uk' ? 'Немає проєктів для оцінювання' : 'No projects to evaluate'}
          />
        </div>
      )}

      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowCreateConflict(v => !v)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> {t.adminDashboardPage.addConflict}
            </button>
            <button onClick={handleExportConflicts} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent">
              <Download className="h-4 w-4" /> {lang === 'uk' ? 'Експорт CSV' : 'Export CSV'}
            </button>
            <span className="ml-auto text-sm text-muted-foreground">
              {lang === 'uk' ? 'Зафіксовано: ' : 'Recorded: '} <strong>{conflicts.length}</strong>
            </span>
          </div>

          {/* Create form */}
          {showCreateConflict && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={newConflict.judgeId}
                onChange={e => setNewConflict(p => ({ ...p, judgeId: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t.adminDashboardPage.selectJudge}</option>
                {judges.map((j: any) => <option key={j.id} value={j.id}>{j.fullName}</option>)}
              </select>
              <select
                value={newConflict.teamId}
                onChange={e => setNewConflict(p => ({ ...p, teamId: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t.adminDashboardPage.selectTeam}</option>
                {teamsForSelect.map((tItem: any) => <option key={tItem.id} value={tItem.id}>{tItem.name}</option>)}
              </select>
              <select
                value={newConflict.reason}
                onChange={e => setNewConflict(p => ({ ...p, reason: e.target.value as any }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="MENTORED">{t.adminDashboardPage.mentoredTeam}</option>
                <option value="RELATIVE">{t.adminDashboardPage.personalRelationship}</option>
              </select>
              <button
                onClick={() => createConflictMut.mutate()}
                disabled={!newConflict.judgeId || !newConflict.teamId || createConflictMut.isPending}
                className="rounded-lg bg-primary text-primary-foreground text-sm font-bold py-2 px-4 disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                {createConflictMut.isPending ? (lang === 'uk' ? 'Створення...' : 'Creating...') : t.adminDashboardPage.save}
              </button>
            </div>
          )}

          {/* Table */}
          {conflictsLoading ? (
            <EmptyState title={lang === 'uk' ? 'Завантаження...' : 'Loading...'} />
          ) : conflicts.length === 0 ? (
            <EmptyState
              title={t.adminDashboardPage.noConflicts}
              description={lang === 'uk' ? 'Судді не декларували конфліктів інтересів для цього хакатону.' : 'Judges have not declared any conflicts of interest for this hackathon.'}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted-foreground border-b border-border bg-muted/20">
                    <th className="px-4 py-3">{t.adminDashboardPage.judge}</th>
                    <th className="px-4 py-3">{t.adminDashboardPage.email}</th>
                    <th className="px-4 py-3">{t.adminDashboardPage.team}</th>
                    <th className="px-4 py-3">{lang === 'uk' ? 'Причина' : 'Reason'}</th>
                    <th className="px-4 py-3">{t.adminDashboardPage.date}</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {conflicts.map((c: any) => {
                    const CONFLICT_REASON_LABEL: Record<string, string> = {
                      MENTORED: t.adminDashboardPage.mentoredTeam,
                      RELATIVE: t.adminDashboardPage.personalRelationship,
                    }
                    return (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors group">
                        <td className="px-4 py-3 font-medium">{c.judge?.fullName || '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{c.judge?.email || '—'}</td>
                        <td className="px-4 py-3">{c.team?.name || '—'}</td>
                        <td className="px-4 py-3">
                          {editConflictId === c.id ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={editConflictReason}
                                onChange={e => setEditConflictReason(e.target.value as any)}
                                className="text-xs rounded border border-border bg-background px-2 py-1 focus:outline-none"
                              >
                                <option value="MENTORED">{lang === 'uk' ? '👨‍🏫 Ментор' : '👨‍🏫 Mentor'}</option>
                                <option value="RELATIVE">{lang === 'uk' ? '👥 Особисті' : '👥 Personal'}</option>
                              </select>
                              <button onClick={() => updateConflictMut.mutate({ id: c.id, reason: editConflictReason })}
                                className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setEditConflictId(null)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors">
                                <XIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span
                              className="text-sm cursor-pointer hover:underline flex items-center gap-1"
                              onClick={() => { setEditConflictId(c.id); setEditConflictReason(c.reason || 'MENTORED') }}
                              title={lang === 'uk' ? 'Клацніть для редагування' : 'Click to edit'}
                            >
                              {CONFLICT_REASON_LABEL[c.reason] ?? c.reason ?? '—'}
                              <Pencil className="inline h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-60" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => { if (confirm(t.adminDashboardPage.confirmDeleteConflict)) deleteConflictMut.mutate(c.id) }}
                            disabled={deleteConflictMut.isPending}
                            className="opacity-0 group-hover:opacity-100 rounded p-1.5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            <button onClick={() => qc.invalidateQueries({ queryKey: ['leaderboard'] })} 
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent">
              <RefreshCcw className={clsx("h-4 w-4", boardFetching && "animate-spin")} /> {lang === 'uk' ? 'Оновити' : 'Refresh'}
            </button>
            <button onClick={handleExportLeaderboard} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent">
              <Download className="h-4 w-4" /> {lang === 'uk' ? 'Експорт CSV' : 'Export CSV'}
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'rank', header: lang === 'uk' ? 'Місце' : 'Rank', className: 'w-16 font-bold', render: (l) => l.rank },
              { key: 'team', header: t.adminDashboardPage.team, render: (l) => <span className="font-medium">{l.teamName}</span> },
              { key: 'score', header: t.adminDashboardPage.score, render: (l) => <span className="font-bold text-primary">{Number(l.totalScore).toFixed(2)}</span> },
            ]}
            data={leaderboardPagination.slice}
            total={leaderboardPagination.total}
            page={leaderboardPagination.page}
            limit={leaderboardPagination.limit}
            onPageChange={leaderboardPagination.setPage}
            onLimitChange={leaderboardPagination.setLimit}
            loading={boardLoading}
            emptyTitle={lang === 'uk' ? "Результати з'являться після оцінювання" : "Results will appear after evaluation"}
            rowClassName={(l) => {
              if (l.rank === 1) return 'border-l-4 border-l-yellow-400 bg-yellow-50/10'
              if (l.rank === 2) return 'border-l-4 border-l-gray-300 bg-gray-50/10'
              if (l.rank === 3) return 'border-l-4 border-l-amber-600 bg-amber-50/10'
              return ''
            }}
          />
        </div>
      )}

      {selectedProjectId && (
        <ScoreDetailDrawer 
          projectId={selectedProjectId} 
          hackathonId={hackathonId} 
          onClose={() => setSelectedProjectId(null)} 
        />
      )}
    </div>
  )
}

function TrackCriteriaSection({ 
  track, newCriteria, setNewCriteria, onCreate, onDelete, onUpdate, isLoading 
}: { 
  track: Track; newCriteria: any; setNewCriteria: any; onCreate: (v: any) => void; onDelete: (id: string) => void; onUpdate: (id: string, data: any) => void; isLoading: boolean 
}) {
  const { t, lang } = useI18n()
  const { data } = useQuery({
    queryKey: ['criteria', track.id],
    queryFn: () => judgingApi.listCriteria(track.id),
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', maxScore: 10, weight: 0.1 })

  const criteriaList = (data?.data.data ?? []) as Criteria[]
  const totalWeight = useMemo(() => criteriaList.reduce((sum, c) => sum + Number(c.weight), 0), [criteriaList])
  const isOverweight = totalWeight > 1.0

  const handleStartEdit = (c: Criteria) => {
    setEditingId(c.id)
    setEditForm({ name: c.name, maxScore: c.maxScore, weight: Number(c.weight) })
  }

  const handleSaveEdit = () => {
    if (editingId) {
      onUpdate(editingId, editForm)
      setEditingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/30 px-5 py-4 flex items-center justify-between border-b border-border">
        <h3 className="font-semibold">{track.name}</h3>
        <span className={clsx("text-sm font-medium", isOverweight ? "text-destructive" : "text-muted-foreground")}>
          {lang === 'uk' ? 'Сума ваг: ' : 'Sum of weights: '}{totalWeight.toFixed(2)} / 1.0
        </span>
      </div>
      
      <div className="p-5 space-y-5">
        {isOverweight && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
            <AlertTriangle className="h-4 w-4" />
            {lang === 'uk' ? 'Сума ваг перевищує 1.0. Зменште вагу деяких критеріїв.' : 'Sum of weights exceeds 1.0. Decrease weight of some criteria.'}
          </div>
        )}

        <div className="space-y-3">
          {criteriaList.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-4 text-sm hover:bg-muted/5 transition-colors">
              {editingId === c.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm" placeholder={lang === 'uk' ? 'Назва' : 'Name'} />
                    </div>
                    <div>
                      <input type="number" step="0.1" value={editForm.weight} onChange={e => setEditForm({ ...editForm, weight: parseFloat(e.target.value) })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm" placeholder={t.adminDashboardPage.weight} />
                    </div>
                    <div>
                      <input type="number" value={editForm.maxScore} onChange={e => setEditForm({ ...editForm, maxScore: parseInt(e.target.value) })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm" placeholder={t.adminDashboardPage.maxScore} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:underline">{t.actions.cancel}</button>
                    <button onClick={handleSaveEdit} disabled={isLoading || !editForm.name} className="text-xs font-bold text-primary hover:underline disabled:opacity-50">{t.adminDashboardPage.save}</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === 'uk' ? 'Макс. бал: ' : 'Max score: '}<span className="font-medium text-foreground">{c.maxScore}</span> • {lang === 'uk' ? 'Вага: ' : 'Weight: '}<span className="font-medium text-foreground">{c.weight}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleStartEdit(c)} disabled={isLoading} className="text-xs text-primary hover:underline disabled:opacity-50 font-medium">
                      {t.actions.edit}
                    </button>
                    <button onClick={() => onDelete(c.id)} disabled={isLoading} className="text-xs text-destructive hover:underline disabled:opacity-50 font-medium">
                      {t.actions.delete}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {criteriaList.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">{lang === 'uk' ? 'Критеріїв ще немає.' : 'No criteria yet.'}</p>}
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-6 border-t border-border mt-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{lang === 'uk' ? 'Новий критерій' : 'New criterion'}</label>
            <input type="text" value={newCriteria.trackId === track.id ? newCriteria.name : ''}
              onChange={(e) => setNewCriteria({ ...newCriteria, trackId: track.id, name: e.target.value })}
              placeholder={lang === 'uk' ? 'Назва (напр. Дизайн)' : 'Name (e.g. Design)'}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="w-24">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.adminDashboardPage.weight} (0-1)</label>
            <input type="number" step="0.1" min="0.1" max="1.0"
              value={newCriteria.trackId === track.id ? newCriteria.weight : ''}
              onChange={(e) => setNewCriteria({ ...newCriteria, trackId: track.id, weight: parseFloat(e.target.value) })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="w-24">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.adminDashboardPage.maxScore}</label>
            <input type="number" min="1"
              value={newCriteria.trackId === track.id ? newCriteria.maxScore : ''}
              onChange={(e) => setNewCriteria({ ...newCriteria, trackId: track.id, maxScore: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <button 
            disabled={isLoading || newCriteria.trackId !== track.id || !newCriteria.name}
            onClick={() => onCreate(newCriteria)}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-[38px] transition-colors font-bold flex items-center gap-2">
            <Plus className="h-4 w-4" /> {t.actions.add}
          </button>
        </div>
      </div>
    </div>
  )
}
