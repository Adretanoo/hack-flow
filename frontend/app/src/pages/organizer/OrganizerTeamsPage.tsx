import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizerApi } from '@/api/organizer'
import { Users, CheckCircle, XCircle, Search, Filter, Trophy } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:      { label: 'На розгляді',      color: 'bg-yellow-100 text-yellow-700' },
  APPROVED:     { label: 'Схвалено',         color: 'bg-green-100 text-green-700' },
  REJECTED:     { label: 'Відхилено',        color: 'bg-red-100 text-red-700' },
  DISQUALIFIED: { label: 'Дискваліфіковано', color: 'bg-gray-100 text-gray-600' },
}

export function OrganizerTeamsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [hackathonFilter, setHackathonFilter] = useState('')

  // Get organizer's hackathons for filter
  const { data: hackathonsData } = useQuery({
    queryKey: ['organizer-hackathons-select'],
    queryFn: () => organizerApi.list({ limit: 100 }),
  })

  // Get all teams from selected hackathon
  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['organizer-teams', hackathonFilter, statusFilter],
    queryFn: () => organizerApi.listTeams(hackathonFilter, {
      status: statusFilter || undefined,
    }),
    enabled: !!hackathonFilter,
  })

  const approveMut = useMutation({
    mutationFn: (teamId: string) => organizerApi.approveTeam(teamId),
    onSuccess: () => { toast.success('Команду схвалено!'); qc.invalidateQueries({ queryKey: ['organizer-teams'] }) },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Помилка'),
  })

  const rejectMut = useMutation({
    mutationFn: (teamId: string) => organizerApi.rejectTeam(teamId),
    onSuccess: () => { toast.success('Команду відхилено'); qc.invalidateQueries({ queryKey: ['organizer-teams'] }) },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Помилка'),
  })

  const hackathons = (hackathonsData?.data.data ?? []) as any[]
  const allTeams   = (teamsData?.data.data ?? []) as any[]
  const teams = allTeams.filter((t: any) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-5 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-6 h-28 w-28 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-xs font-medium text-orange-100 mb-1">Кабінет організатора</p>
          <h1 className="text-xl font-bold">Управління командами</h1>
          <p className="text-sm text-orange-100 mt-0.5">Схвалюйте або відхиляйте реєстрації команд</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Hackathon select */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Хакатон
          </label>
          <select
            value={hackathonFilter}
            onChange={e => setHackathonFilter(e.target.value)}
            className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
          >
            <option value="">Оберіть хакатон...</option>
            {hackathons.map((h: any) => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Статус
          </label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
          >
            <option value="">Всі статуси</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" /> Пошук
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Назва команди..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-input bg-card outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Teams */}
      {!hackathonFilter ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Оберіть хакатон щоб переглянути команди</p>
        </div>
      ) : isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Команд не знайдено</p>
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Всього',    value: allTeams.length, color: 'text-foreground' },
              { label: 'На розгляді', value: allTeams.filter((t:any) => t.approvals?.[0]?.status === 'PENDING').length, color: 'text-yellow-600' },
              { label: 'Схвалено',  value: allTeams.filter((t:any) => t.approvals?.[0]?.status === 'APPROVED').length, color: 'text-green-600' },
              { label: 'Відхилено', value: allTeams.filter((t:any) => t.approvals?.[0]?.status === 'REJECTED').length, color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            {teams.map((team: any) => {
              const status = team.approvals?.[0]?.status ?? 'PENDING'
              const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
              const isPending = status === 'PENDING'
              return (
                <div
                  key={team.id}
                  className="rounded-xl border border-border bg-card p-4 transition-all hover:border-orange-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 font-bold">
                      {team.name?.[0]?.toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team._count?.members ?? team.members?.length ?? 0} учасників
                        {team.track?.name ? ` • ${team.track.name}` : ''}
                      </p>
                    </div>
                    {/* Status badge */}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {/* Actions */}
                    {isPending && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => approveMut.mutate(team.id)}
                          disabled={approveMut.isPending}
                          className="flex items-center gap-1.5 rounded-xl bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:opacity-60 transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Схвалити
                        </button>
                        <button
                          onClick={() => rejectMut.mutate(team.id)}
                          disabled={rejectMut.isPending}
                          className="flex items-center gap-1.5 rounded-xl bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-60 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Відхилити
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
