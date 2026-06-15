import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { DataTable } from '@/components/shared/DataTable'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/utils/format'
import { Eye, Search } from 'lucide-react'
import { clsx } from 'clsx'
import type { UserProfile } from '@/types/api.types'
import type { Column } from '@/components/shared/DataTable'
import { useI18n } from '@/i18n'
import { usePageTitle } from '@/hooks/usePageTitle'

const ROLE_COLORS: Record<string, string> = {
  admin:       'bg-red-100 text-red-700',
  judge:       'bg-violet-100 text-violet-700',
  mentor:      'bg-blue-100 text-blue-700',
  organizer:   'bg-orange-100 text-orange-700',
  participant: 'bg-muted text-muted-foreground',
}

export function UsersListPage() {
  const { t, lang } = useI18n()
  usePageTitle(t.adminUsers.title)
  const navigate = useNavigate()
  const { page, limit, setPage, setLimit } = usePagination(20)

  const [search, setSearch]               = useState('')
  const [roleFilter, setRoleFilter]       = useState('')
  const [lookingForTeam, setLookingForTeam] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, roleFilter, lookingForTeam, debouncedSearch],
    queryFn: () => usersApi.list({
      page, limit,
      search: debouncedSearch || undefined,
      role: roleFilter || undefined,
      lookingForTeam: lookingForTeam || undefined,
    }),
  })

  const queryClient = useQueryClient()
  const roleMut = useMutation({
    mutationFn: (data: { id: string; role: string }) => usersApi.updateRole(data.id, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const users = (data?.data.data ?? []) as UserProfile[]
  const total = data?.data.meta?.total ?? 0

  const roleTabs = useMemo(() => [
    { value: '',            label: t.states.all },
    { value: 'admin',       label: t.adminUsers.roles.admin },
    { value: 'organizer',   label: lang === 'uk' ? 'Організатор' : 'Organizer' },
    { value: 'judge',       label: t.adminUsers.roles.judge },
    { value: 'mentor',      label: t.adminUsers.roles.mentor },
    { value: 'participant', label: t.adminUsers.roles.participant },
  ], [t, lang])

  const columns: Column<UserProfile>[] = [
    {
      key: 'avatar',
      header: '',
      className: 'w-10',
      render: (u) => u.avatarUrl
        ? <img src={u.avatarUrl} className="h-8 w-8 rounded-full object-cover" alt="" />
        : <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {u.fullName?.[0]?.toUpperCase()}
          </div>,
    },
    {
      key: 'fullName',
      header: t.adminUsers.fullName,
      render: (u) => (
        <div>
          <p className="font-medium">{u.fullName}</p>
          <p className="text-xs text-muted-foreground">@{u.username}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: t.adminUsers.email,
      render: (u) => <span className="text-sm text-muted-foreground">{u.email}</span>,
    },
    {
      key: 'role',
      header: t.adminUsers.role,
      render: (u) => (
        <select
          value={u.role}
          onChange={(e) => roleMut.mutate({ id: u.id, role: e.target.value })}
          disabled={roleMut.isPending}
          className={clsx(
            'text-xs font-semibold px-2.5 py-1 rounded-full border border-border outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer',
            ROLE_COLORS[u.role] ?? 'bg-muted text-muted-foreground'
          )}
        >
          <option value="participant">{t.adminUsers.roles.participant}</option>
          <option value="mentor">{t.adminUsers.roles.mentor}</option>
          <option value="judge">{t.adminUsers.roles.judge}</option>
          <option value="organizer">{lang === 'uk' ? 'Організатор' : 'Organizer'}</option>
          <option value="admin">{t.adminUsers.roles.admin}</option>
        </select>
      ),
    },
    {
      key: 'lookingForTeam',
      header: lang === 'uk' ? 'Шукає команду' : 'Looking for team',
      render: (u) => u.isLookingForTeam
        ? <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">{t.actions.yes}</span>
        : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: 'createdAt',
      header: lang === 'uk' ? 'Реєстрація' : 'Registered',
      render: (u) => <span className="text-xs text-muted-foreground">{formatDate(u.createdAt, lang)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (u) => (
        <button title={t.adminUsers.view} className="rounded-md p-1.5 hover:bg-accent transition-colors"
          onClick={() => navigate(`/users/${u.id}`)}>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">{t.adminUsers.title}</h2>
        <p className="text-sm text-muted-foreground">{lang === 'uk' ? 'Всі зареєстровані акаунти' : 'All registered accounts'}</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder={t.adminUsers.searchPlaceholder}
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 w-64" />
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden">
          {roleTabs.map((tab) => (
            <button key={tab.value} onClick={() => { setRoleFilter(tab.value); setPage(1) }}
              className={clsx('px-3 py-2 text-sm font-medium transition-colors',
                roleFilter === tab.value ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent')}>
              {tab.label}
            </button>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={lookingForTeam} onChange={(e) => { setLookingForTeam(e.target.checked); setPage(1) }}
            className="h-4 w-4 accent-primary" />
          {lang === 'uk' ? 'Шукають команду' : 'Looking for team'}
        </label>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle={t.adminUsers.noUsers}
        emptyDescription={t.shared.emptyState.defaultDesc}
      />
    </div>
  )
}
