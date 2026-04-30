import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { DataTable } from '@/components/shared/DataTable'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/utils/format'
import { Eye, Search } from 'lucide-react'
import { clsx } from 'clsx'
import type { UserProfile } from '@/types/api.types'
import type { Column } from '@/components/shared/DataTable'

const ROLE_TABS = [
  { value: '',            label: 'Всі' },
  { value: 'admin',       label: 'Адміни' },
  { value: 'judge',       label: 'Судді' },
  { value: 'mentor',      label: 'Ментори' },
  { value: 'participant', label: 'Учасники' },
]

const ROLE_COLORS: Record<string, string> = {
  admin:       'bg-red-100 text-red-700',
  judge:       'bg-violet-100 text-violet-700',
  mentor:      'bg-blue-100 text-blue-700',
  participant: 'bg-muted text-muted-foreground',
}

import { usePageTitle } from '@/hooks/usePageTitle'

export function UsersListPage() {
  usePageTitle('Користувачі')
  const navigate = useNavigate()
  const { page, limit, setPage } = usePagination(20)

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

  const users = (data?.data.data ?? []) as UserProfile[]
  const total = data?.data.total ?? 0

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
      header: "Ім'я",
      render: (u) => (
        <div>
          <p className="font-medium">{u.fullName}</p>
          <p className="text-xs text-muted-foreground">@{u.username}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (u) => <span className="text-sm text-muted-foreground">{u.email}</span>,
    },
    {
      key: 'role',
      header: 'Роль',
      render: (u) => (
        <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-semibold', ROLE_COLORS[u.role] ?? 'bg-muted text-muted-foreground')}>
          {u.role}
        </span>
      ),
    },
    {
      key: 'lookingForTeam',
      header: 'Шукає команду',
      render: (u) => u.isLookingForTeam
        ? <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Так</span>
        : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: 'createdAt',
      header: 'Реєстрація',
      render: (u) => <span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (u) => (
        <button title="Переглянути" className="rounded-md p-1.5 hover:bg-accent transition-colors"
          onClick={() => navigate(`/users/${u.id}`)}>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Користувачі</h2>
        <p className="text-sm text-muted-foreground">Всі зареєстровані акаунти</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Пошук за ім'ям або email…"
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 w-64" />
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden">
          {ROLE_TABS.map((tab) => (
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
          Шукають команду
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
        emptyTitle="Користувачів не знайдено"
        emptyDescription="Спробуйте змінити фільтри."
      />
    </div>
  )
}
