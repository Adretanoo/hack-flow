import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsApi } from '@/api/teams'
import { hackathonsApi } from '@/api/hackathons'
import { DataTable } from '@/components/shared/DataTable'
import { BulkApprovalBar } from '@/components/shared/BulkApprovalBar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/utils/format'
import { Eye, Search, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import type { Team } from '@/types/api.types'
import type { Column } from '@/components/shared/DataTable'
import { useI18n } from '@/i18n'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/store/auth.store'

export function TeamsListPage() {
  const { t, lang } = useI18n()
  usePageTitle(t.adminTeams.title)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { page, limit, setPage, setLimit } = usePagination(20)
  const { user } = useAuthStore()
  const isOrganizer = user?.role === 'organizer'

  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [hackathonId, setHackathonId]   = useState('')
  const [trackId, setTrackId]           = useState('')
  const [selectedIds, setSelectedIds]   = useState<string[]>([])
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  // Local optimistic overrides: teamId -> new status shown immediately in SELECT
  const [teamStatusOverrides, setTeamStatusOverrides] = useState<Record<string, string>>({})

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['teams', page, limit, statusFilter, hackathonId, trackId, debouncedSearch],
    queryFn: () => teamsApi.list({
      page, limit,
      hackathon_id: hackathonId || undefined,
      track_id: trackId || undefined,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    }),
  })

  const { data: hackData } = useQuery({
    queryKey: ['hackathons', 'all'],
    queryFn: () => hackathonsApi.list({ limit: 100 }),
  })

  // For organizer: auto-select first hackathon when data loads
  useEffect(() => {
    if (isOrganizer && hackData) {
      const list = hackData.data.data ?? []
      if (list.length > 0 && !hackathonId) {
        setHackathonId(list[0].id)
      }
    }
  }, [isOrganizer, hackData])

  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => hackathonsApi.listTracks(hackathonId),
    enabled: !!hackathonId,
  })

  const teamsQueryKey = ['teams', page, limit, statusFilter, hackathonId, trackId, debouncedSearch]

  const approvalMut = useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: string; comment?: string }) =>
      teamsApi.updateApproval(id, { status, comment }),

    onMutate: async ({ id: teamId, status }) => {
      await qc.cancelQueries({ queryKey: teamsQueryKey })
      const prev = qc.getQueryData<any>(teamsQueryKey)
      qc.setQueryData(teamsQueryKey, (old: any) => {
        if (!old?.data?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: (old.data.data as any[]).map((t: any) =>
              t.id === teamId ? { ...t, approvalStatus: status } : t
            ),
          },
        }
      })
      return { prev }
    },

    onError: (_err, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(teamsQueryKey, ctx.prev)
      // Revert local override on error
      setTeamStatusOverrides(prev => { const n = { ...prev }; delete n[vars.id]; return n })
      toast.error(lang === 'uk' ? 'Помилка при оновленні' : 'Error updating status')
    },

    onSuccess: async (_data, vars) => {
      toast.success(lang === 'uk' ? 'Статус оновлено' : 'Status updated')
      // Refetch first, THEN clear override — so UI never falls back to stale data mid-flight
      await qc.refetchQueries({ queryKey: teamsQueryKey })
      setTeamStatusOverrides(prev => { const n = { ...prev }; delete n[vars.id]; return n })
      qc.invalidateQueries({ queryKey: ['full-results'] })
      setRejectTarget(null)
    },
  })

  const bulkMut = useMutation({
    mutationFn: async (status: 'APPROVED' | 'REJECTED') => {
      await Promise.all(selectedIds.map((id) => teamsApi.updateApproval(id, { status })))
    },
    onSuccess: async () => {
      toast.success(lang === 'uk' ? 'Статуси оновлено' : 'Statuses updated')
      await qc.refetchQueries({ queryKey: ['teams'] })
      await qc.refetchQueries({ queryKey: ['full-results'] })
      setSelectedIds([])
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка при масовому оновленні' : 'Error bulk updating statuses'),
  })

  const rawTeams = (data?.data.data ?? []) as Team[]
  const total = data?.data.meta?.total ?? 0
  const hackathons = hackData?.data.data ?? []
  const tracks = tracksData?.data.data ?? []

  const pendingCount = rawTeams.filter(t => t.approvalStatus === 'PENDING').length

  // PENDING teams first
  const teams = [...rawTeams].sort((a, b) => {
    if (a.approvalStatus === 'PENDING' && b.approvalStatus !== 'PENDING') return -1
    if (b.approvalStatus === 'PENDING' && a.approvalStatus !== 'PENDING') return 1
    return 0
  })

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleAll = () =>
    setSelectedIds(selectedIds.length === teams.length ? [] : teams.map((t) => t.id))

  const statusTabs = useMemo(() => [
    { value: '',             label: t.states.all },
    { value: 'PENDING',      label: t.states.pending },
    { value: 'APPROVED',     label: t.states.approved },
    { value: 'REJECTED',     label: t.states.rejected },
    { value: 'DISQUALIFIED', label: lang === 'uk' ? 'Дискваліф.' : 'Disqual.' },
  ], [t, lang])

  const getPendingAlertLabel = (n: number) => {
    if (lang === 'uk') {
      const lastDigit = n % 10;
      const lastTwo = n % 100;
      if (lastTwo >= 11 && lastTwo <= 19) return `${n} команд очікують затвердження`;
      if (lastDigit === 1) return `${n} команда очікує затвердження`;
      if (lastDigit >= 2 && lastDigit <= 4) return `${n} команди очікують затвердження`;
      return `${n} команд очікують затвердження`;
    }
    return `${n} ${n === 1 ? 'team is' : 'teams are'} pending approval`;
  }

  const columns: Column<Team>[] = [
    {
      key: 'check',
      header: (
        <input type="checkbox" checked={selectedIds.length === teams.length && teams.length > 0}
          onChange={toggleAll} className="h-4 w-4 accent-primary" />
      ) as unknown as string,
      className: 'w-10',
      render: (teamItem) => (
        <input type="checkbox" checked={selectedIds.includes(teamItem.id)}
          onChange={() => toggleSelect(teamItem.id)} className="h-4 w-4 accent-primary" />
      ),
    },
    {
      key: 'logo',
      header: '',
      className: 'w-10',
      render: (teamItem) => teamItem.logo
        ? <img src={teamItem.logo} className="h-8 w-8 rounded-full object-cover" alt="" />
        : <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{teamItem.name[0]?.toUpperCase()}</div>,
    },
    {
      key: 'name',
      header: t.adminTeams.title,
      render: (teamItem) => <span className="font-medium">{teamItem.name}</span>,
    },
    {
      key: 'hackathon',
      header: t.adminTeams.hackathon,
      render: (teamItem) => <span className="text-sm text-muted-foreground">{(teamItem.hackathon as { title?: string } | undefined)?.title ?? '—'}</span>,
    },
    {
      key: 'track',
      header: t.adminTeams.track,
      render: (teamItem) => <span className="text-sm text-muted-foreground">{(teamItem.track as { name?: string } | null)?.name ?? '—'}</span>,
    },
    {
      key: 'status',
      header: t.adminTeams.status,
      render: (teamItem) => {
        const currentStatus = teamStatusOverrides[teamItem.id] ?? teamItem.approvalStatus
        return (
          <select
            value={currentStatus}
            onChange={(e) => {
              const newStatus = e.target.value
              if (newStatus === 'REJECTED') {
                setRejectTarget(teamItem.id)
              } else {
                // Set local override immediately — no disabled, no snap-back
                setTeamStatusOverrides(prev => ({ ...prev, [teamItem.id]: newStatus }))
                approvalMut.mutate({ id: teamItem.id, status: newStatus as 'APPROVED' | 'PENDING' | 'DISQUALIFIED' })
              }
            }}
            disabled={false}
            className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
            style={{
              backgroundColor: currentStatus === 'APPROVED' ? 'var(--green-50, #f0fdf4)' : currentStatus === 'REJECTED' ? 'var(--red-50, #fef2f2)' : currentStatus === 'DISQUALIFIED' ? 'var(--neutral-100, #f5f5f5)' : 'var(--amber-50, #fffbeb)',
              color: currentStatus === 'APPROVED' ? 'var(--green-700, #15803d)' : currentStatus === 'REJECTED' ? 'var(--red-700, #b91c1c)' : currentStatus === 'DISQUALIFIED' ? 'var(--neutral-600, #525252)' : 'var(--amber-700, #b45309)'
            }}
          >
            <option value="PENDING">{t.states.pending}</option>
            <option value="APPROVED">{t.states.approved}</option>
            <option value="REJECTED">{t.states.rejected}</option>
            <option value="DISQUALIFIED">{lang === 'uk' ? 'Дискваліфіковано' : 'Disqualified'}</option>
          </select>
        )
      },
    },
    {
      key: 'members',
      header: t.adminTeams.members,
      render: (teamItem) => <span className="text-sm text-muted-foreground">{teamItem._count?.members ?? '—'}</span>,
    },
    {
      key: 'createdAt',
      header: lang === 'uk' ? 'Дата' : 'Date',
      render: (teamItem) => <span className="text-xs text-muted-foreground">{formatDate(teamItem.createdAt, lang)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (teamItem) => (
        <div className="flex items-center gap-1 justify-end">
          <button title={t.adminTeams.view} className="rounded-md p-1.5 hover:bg-accent"
            onClick={() => navigate(`/teams/${teamItem.id}`)}>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">{t.adminTeams.title}</h2>
        <p className="text-sm text-muted-foreground">{lang === 'uk' ? 'Управління командами та їхнім затвердженням' : 'Manage teams and their approvals'}</p>
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && statusFilter !== 'PENDING' && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Bell className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {getPendingAlertLabel(pendingCount)}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {lang === 'uk' 
                ? 'Команди що змінили назву, опис або трек автоматично переходять у статус «Очікує».' 
                : 'Teams that changed their name, description, or track automatically switch to "Pending" status.'}
            </p>
          </div>
          <button
            onClick={() => { setStatusFilter('PENDING'); setPage(1) }}
            className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            {t.adminTeams.view}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder={lang === 'uk' ? 'Пошук за назвою…' : 'Search by name...'}
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 w-56" />
        </div>

        <select value={hackathonId} onChange={(e) => { setHackathonId(e.target.value); setTrackId(''); setPage(1) }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
          {!isOrganizer && <option value="">{lang === 'uk' ? 'Всі хакатони' : 'All Hackathons'}</option>}
          {hackathons.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>

        {tracks.length > 0 && (
          <select value={trackId} onChange={(e) => { setTrackId(e.target.value); setPage(1) }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
            <option value="">{lang === 'uk' ? 'Всі треки' : 'All Tracks'}</option>
            {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}

        {/* Status tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {statusTabs.map((tab) => (
            <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              className={clsx('px-3 py-2 text-sm font-medium transition-colors',
                statusFilter === tab.value ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent')}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table with PENDING highlight */}
      <div>
        <DataTable
          columns={columns}
          data={teams}
          loading={isLoading}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          emptyTitle={lang === 'uk' ? 'Команд не знайдено за вашим фільтром' : 'No teams found for your filter'}
          emptyDescription={t.shared.emptyState.defaultDesc}
          rowClassName={(t: Team) => t.approvalStatus === 'PENDING' ? 'border-l-2 border-l-amber-400' : ''}
        />
      </div>

      <BulkApprovalBar
        count={selectedIds.length}
        loading={bulkMut.isPending}
        onApprove={() => bulkMut.mutate('APPROVED')}
        onReject={() => bulkMut.mutate('REJECTED')}
        onClear={() => setSelectedIds([])}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        title={lang === 'uk' ? 'Відхилити команду?' : 'Reject team?'}
        description={lang === 'uk' ? 'Команда отримає статус REJECTED. Ви можете змінити це пізніше на сторінці деталей.' : 'The team will be set to REJECTED. You can change this later on the details page.'}
        confirmLabel={t.adminTeams.reject}
        onConfirm={() => rejectTarget && approvalMut.mutate({ id: rejectTarget, status: 'REJECTED' })}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  )
}
