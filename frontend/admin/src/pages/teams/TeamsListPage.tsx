import { useState } from 'react'
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
import { Eye, Search } from 'lucide-react'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import type { Team } from '@/types/api.types'
import type { Column } from '@/components/shared/DataTable'

const STATUS_TABS = [
  { value: '',             label: 'Всі' },
  { value: 'PENDING',      label: 'Очікують' },
  { value: 'APPROVED',     label: 'Схвалені' },
  { value: 'REJECTED',     label: 'Відхилені' },
  { value: 'DISQUALIFIED', label: 'Дискваліф.' },
]

import { usePageTitle } from '@/hooks/usePageTitle'

export function TeamsListPage() {
  usePageTitle('Команди')
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination(10)

  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [hackathonId, setHackathonId]   = useState('')
  const [trackId, setTrackId]           = useState('')
  const [selectedIds, setSelectedIds]   = useState<string[]>([])
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)

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

  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => hackathonsApi.listTracks(hackathonId),
    enabled: !!hackathonId,
  })

  const approvalMut = useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: string; comment?: string }) =>
      teamsApi.updateApproval(id, { status, comment }),
    onSuccess: () => {
      toast.success('Статус оновлено')
      qc.invalidateQueries({ queryKey: ['teams'] })
      setRejectTarget(null)
    },
    onError: () => toast.error('Помилка при оновленні'),
  })

  const bulkMut = useMutation({
    mutationFn: async (status: 'APPROVED' | 'REJECTED') => {
      await Promise.all(selectedIds.map((id) => teamsApi.updateApproval(id, { status })))
    },
    onSuccess: () => {
      toast.success('Статуси оновлено')
      qc.invalidateQueries({ queryKey: ['teams'] })
      setSelectedIds([])
    },
    onError: () => toast.error('Помилка при масовому оновленні'),
  })

  const rawTeams = (data?.data.data ?? []) as Team[]
  const total = data?.data.total ?? 0
  const hackathons = hackData?.data.data ?? []
  const tracks = tracksData?.data.data ?? []

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

  const columns: Column<Team>[] = [
    {
      key: 'check',
      header: (
        <input type="checkbox" checked={selectedIds.length === teams.length && teams.length > 0}
          onChange={toggleAll} className="h-4 w-4 accent-primary" />
      ) as unknown as string,
      className: 'w-10',
      render: (t) => (
        <input type="checkbox" checked={selectedIds.includes(t.id)}
          onChange={() => toggleSelect(t.id)} className="h-4 w-4 accent-primary" />
      ),
    },
    {
      key: 'logo',
      header: '',
      className: 'w-10',
      render: (t) => t.logo
        ? <img src={t.logo} className="h-8 w-8 rounded-full object-cover" alt="" />
        : <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{t.name[0]?.toUpperCase()}</div>,
    },
    {
      key: 'name',
      header: 'Команда',
      render: (t) => <span className="font-medium">{t.name}</span>,
    },
    {
      key: 'hackathon',
      header: 'Хакатон',
      render: (t) => <span className="text-sm text-muted-foreground">{(t.hackathon as { title?: string } | undefined)?.title ?? '—'}</span>,
    },
    {
      key: 'track',
      header: 'Трек',
      render: (t) => <span className="text-sm text-muted-foreground">{(t.track as { name?: string } | null)?.name ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Статус',
      render: (t) => (
        <select
          value={t.approvalStatus}
          onChange={(e) => {
            if (e.target.value === 'REJECTED') {
              setRejectTarget(t.id)
            } else {
              approvalMut.mutate({ id: t.id, status: e.target.value as 'APPROVED' | 'PENDING' })
            }
          }}
          disabled={approvalMut.isPending}
          className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
          style={{
            backgroundColor: t.approvalStatus === 'APPROVED' ? 'var(--green-50, #f0fdf4)' : t.approvalStatus === 'REJECTED' ? 'var(--red-50, #fef2f2)' : 'var(--amber-50, #fffbeb)',
            color: t.approvalStatus === 'APPROVED' ? 'var(--green-700, #15803d)' : t.approvalStatus === 'REJECTED' ? 'var(--red-700, #b91c1c)' : 'var(--amber-700, #b45309)'
          }}
        >
          <option value="PENDING">Очікує</option>
          <option value="APPROVED">Схвалено</option>
          <option value="REJECTED">Відхилено</option>
        </select>
      ),
    },
    {
      key: 'members',
      header: 'Учасники',
      render: (t) => <span className="text-sm text-muted-foreground">{t._count?.members ?? '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Дата',
      render: (t) => <span className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (t) => (
        <div className="flex items-center gap-1 justify-end">
          <button title="Переглянути" className="rounded-md p-1.5 hover:bg-accent"
            onClick={() => navigate(`/teams/${t.id}`)}>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Команди</h2>
        <p className="text-sm text-muted-foreground">Управління командами та їхнім затвердженням</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Пошук за назвою…"
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 w-56" />
        </div>

        <select value={hackathonId} onChange={(e) => { setHackathonId(e.target.value); setTrackId(''); setPage(1) }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
          <option value="">Всі хакатони</option>
          {hackathons.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>

        {tracks.length > 0 && (
          <select value={trackId} onChange={(e) => { setTrackId(e.target.value); setPage(1) }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
            <option value="">Всі треки</option>
            {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}

        {/* Status tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {STATUS_TABS.map((tab) => (
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
          emptyTitle="Команд не знайдено за вашим фільтром"
          emptyDescription="Спробуйте змінити фільтри або почекати на нові заявки."
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
        title="Відхилити команду?"
        description="Команда отримає статус REJECTED. Ви можете змінити це пізніше на сторінці деталей."
        confirmLabel="Відхилити"
        onConfirm={() => rejectTarget && approvalMut.mutate({ id: rejectTarget, status: 'REJECTED' })}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  )
}
