import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate, formatDateTime } from '@/utils/format'
import { ArrowLeft, Link, MessageCircle, Hash } from 'lucide-react'
import { clsx } from 'clsx'
import type { UserProfile, AuditLogEntry } from '@/types/api.types'

type Tab = 'profile' | 'roles' | 'activity' | 'teams'
const TABS: { key: Tab; label: string }[] = [
  { key: 'profile',  label: 'Профіль' },
  { key: 'roles',    label: 'Ролі' },
  { key: 'activity', label: 'Активність' },
  { key: 'teams',    label: 'Команди' },
]

const ROLE_COLORS: Record<string, string> = {
  admin:       'bg-red-100 text-red-700',
  judge:       'bg-violet-100 text-violet-700',
  mentor:      'bg-blue-100 text-blue-700',
  participant: 'bg-muted text-muted-foreground',
}

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  github:   Link,
  telegram: MessageCircle,
  discord:  Hash,
  viber:    MessageCircle,
}

import { usePageTitle } from '@/hooks/usePageTitle'

export function UserDetailPage() {
  usePageTitle('Користувач')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  })

  const { data: activityData } = useQuery({
    queryKey: ['user-activity', id],
    queryFn: () => usersApi.getUserActivity(id!, { limit: 20 }),
    enabled: activeTab === 'activity' && !!id,
  })

  if (isLoading) return <LoadingSpinner className="py-20" />

  const user = userData?.data.data as (UserProfile & {
    skills?: string[]
    socials?: { id: string; typeSocial: string; url: string }[]
    teams?: { id: string; name: string; role: string; hackathon: { title: string } }[]
    student?: { groupName?: string; specialty?: string } | null
  }) | undefined

  if (!user) return <div className="py-10 text-center text-muted-foreground">Користувача не знайдено</div>

  const activity = (activityData?.data.data ?? []) as AuditLogEntry[]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/users')}
          className="rounded-lg border border-border p-2 hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          {user.avatarUrl
            ? <img src={user.avatarUrl} className="h-14 w-14 rounded-full object-cover border border-border" alt="" />
            : <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {user.fullName?.[0]?.toUpperCase()}
              </div>
          }
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold">{user.fullName}</h2>
              <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-semibold', ROLE_COLORS[user.role] ?? 'bg-muted')}>
                {user.role}
              </span>
              {user.isLookingForTeam && (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  Шукає команду
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user.email} · @{user.username}</p>
            <p className="text-xs text-muted-foreground">Зареєстровано: {formatDate(user.createdAt)}</p>
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

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h4 className="font-semibold">Загальна інформація</h4>
            {user.description && <p className="text-sm text-muted-foreground">{user.description}</p>}
            {user.skills && user.skills.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Навички</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s) => (
                    <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {user.student && (
              <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm space-y-1">
                <p className="font-medium">Студентська інформація</p>
                {user.student.groupName && <p className="text-muted-foreground">Група: {user.student.groupName}</p>}
                {user.student.specialty && <p className="text-muted-foreground">Спеціальність: {user.student.specialty}</p>}
              </div>
            )}
          </div>

          {user.socials && user.socials.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h4 className="font-semibold">Соціальні мережі</h4>
              {user.socials.map((s) => {
                const Icon = SOCIAL_ICONS[s.typeSocial] ?? Hash
                return (
                  <a key={s.id} href={s.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium capitalize">{s.typeSocial}</span>
                    <span className="text-muted-foreground truncate">{s.url}</span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Roles tab */}
      {activeTab === 'roles' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h4 className="font-semibold">Глобальна роль</h4>
          <div className="flex gap-2">
            <span className={clsx('rounded-full px-3 py-1 text-sm font-semibold', ROLE_COLORS[user.role] ?? 'bg-muted')}>
              {user.role}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Зміна ролей через API адміністратора. Зверніться до БД або додайте endpoint для управління ролями.
          </p>
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div className="space-y-2">
          {activity.length === 0 ? (
            <EmptyState title="Активності немає" description="Дій ще не зафіксовано." />
          ) : activity.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{entry.action}</p>
                {entry.entityType && (
                  <p className="text-xs text-muted-foreground">{entry.entityType} · {entry.entityId}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(entry.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Teams tab */}
      {activeTab === 'teams' && (
        <div>
          {!user.teams || user.teams.length === 0 ? (
            <EmptyState title="Немає команд" description="Цей користувач не є учасником жодної команди." />
          ) : (
            <div className="space-y-2">
              {user.teams.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.hackathon?.title ?? '—'}</p>
                  </div>
                  <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    t.role === 'captain' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground')}>
                    {t.role === 'captain' ? 'Капітан' : 'Учасник'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
