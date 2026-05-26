import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate, formatDateTime } from '@/utils/format'
import { ArrowLeft, Link, MessageCircle, Hash } from 'lucide-react'
import { clsx } from 'clsx'
import type { UserProfile, AuditLogEntry } from '@/types/api.types'
import { useI18n } from '@/i18n'
import { usePageTitle } from '@/hooks/usePageTitle'

type Tab = 'profile' | 'roles' | 'activity' | 'teams'

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

export function UserDetailPage() {
  const { t, lang } = useI18n()
  usePageTitle(lang === 'uk' ? 'Користувач' : 'User Details')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const TABS = useMemo<{ key: Tab; label: string }[]>(() => [
    { key: 'profile',  label: lang === 'uk' ? 'Профіль' : 'Profile' },
    { key: 'roles',    label: lang === 'uk' ? 'Ролі' : 'Roles' },
    { key: 'activity', label: t.adminUsers.activity },
    { key: 'teams',    label: t.adminUsers.teams },
  ], [t, lang])

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  })

  const queryClient = useQueryClient()
  const roleMut = useMutation({
    mutationFn: (role: string) => usersApi.updateRole(id!, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
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

  if (!user) return <div className="py-10 text-center text-muted-foreground">{t.states.notFound}</div>

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
                  {lang === 'uk' ? 'Шукає команду' : 'Looking for team'}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user.email} · @{user.username}</p>
            <p className="text-xs text-muted-foreground">
              {lang === 'uk' ? 'Зареєстровано' : 'Registered'}: {formatDate(user.createdAt, lang)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h4 className="font-semibold">{lang === 'uk' ? 'Загальна інформація' : 'General Information'}</h4>
            {user.description && <p className="text-sm text-muted-foreground">{user.description}</p>}
            {user.skills && user.skills.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.profile.skills}</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s) => (
                    <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {user.student && (
              <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm space-y-1">
                <p className="font-medium">{lang === 'uk' ? 'Студентська інформація' : 'Student Information'}</p>
                {user.student.groupName && <p className="text-muted-foreground">{lang === 'uk' ? 'Група' : 'Group'}: {user.student.groupName}</p>}
                {user.student.specialty && <p className="text-muted-foreground">{lang === 'uk' ? 'Спеціальність' : 'Specialty'}: {user.student.specialty}</p>}
              </div>
            )}
          </div>

          {user.socials && user.socials.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h4 className="font-semibold">{t.profile.socials}</h4>
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
          <h4 className="font-semibold">{lang === 'uk' ? 'Глобальна роль' : 'Global Role'}</h4>
          <div className="max-w-xs">
            <select
              value={user.role}
              onChange={(e) => roleMut.mutate(e.target.value)}
              disabled={roleMut.isPending}
              className={clsx(
                'text-sm font-semibold px-4 py-2 w-full rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer',
                ROLE_COLORS[user.role] ?? 'bg-muted text-muted-foreground'
              )}
            >
              <option value="participant">{t.adminUsers.roles.participant}</option>
              <option value="mentor">{t.adminUsers.roles.mentor}</option>
              <option value="judge">{t.adminUsers.roles.judge}</option>
              <option value="admin">{t.adminUsers.roles.admin}</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            {lang === 'uk' 
              ? 'Глобальна роль визначає основні права доступу користувача до платформи.' 
              : 'Global role determines the user\'s primary access permissions to the platform.'}
          </p>
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div className="space-y-2">
          {activity.length === 0 ? (
            <EmptyState 
              title={lang === 'uk' ? 'Активності немає' : 'No Activity'} 
              description={lang === 'uk' ? 'Дій ще не зафіксовано.' : 'No actions recorded yet.'} 
            />
          ) : activity.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{entry.action}</p>
                {entry.entityType && (
                  <p className="text-xs text-muted-foreground">{entry.entityType} · {entry.entityId}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(entry.createdAt, lang)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Teams tab */}
      {activeTab === 'teams' && (
        <div>
          {!user.teams || user.teams.length === 0 ? (
            <EmptyState 
              title={lang === 'uk' ? 'Немає команд' : 'No Teams'} 
              description={lang === 'uk' ? 'Цей користувач не є учасником жодної команди.' : 'This user is not a member of any teams.'} 
            />
          ) : (
            <div className="space-y-2">
              {user.teams.map((teamItem) => (
                <div key={teamItem.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <p className="font-medium">{teamItem.name}</p>
                    <p className="text-sm text-muted-foreground">{teamItem.hackathon?.title ?? '—'}</p>
                  </div>
                  <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    teamItem.role === 'captain' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground')}>
                    {teamItem.role === 'captain' ? t.teamTab.captain : t.teamTab.member}
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
