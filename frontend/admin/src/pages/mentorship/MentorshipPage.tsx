import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { mentorshipApi } from '@/api/mentorship'
import { hackathonsApi } from '@/api/hackathons'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataTable } from '@/components/shared/DataTable'
import { useClientPagination } from '@/hooks/useClientPagination'
import { SlotDrawer } from './components/SlotDrawer'
import { formatDate, formatDateTime } from '@/utils/format'
import { ArrowLeft, User, Calendar, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import type { MentorAvailability } from '@/types/api.types'
import { useI18n } from '@/i18n'
import { usePageTitle } from '@/hooks/usePageTitle'

type Tab = 'mentors' | 'availabilities'

export function MentorshipPage() {
  const { t, lang } = useI18n()
  usePageTitle(t.adminMentorship.title)
  const { hackathonId } = useParams<{ hackathonId: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('mentors')
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string | null>(null)

  const TABS = useMemo<{ key: Tab; label: string }[]>(() => [
    { key: 'mentors', label: t.adminMentorship.mentors },
    { key: 'availabilities', label: lang === 'uk' ? 'Доступності' : 'Availabilities' },
  ], [t, lang])

  const { data: hackData } = useQuery({
    queryKey: ['hackathons', 'all'],
    queryFn: () => hackathonsApi.list({ limit: 100 }),
  })

  const { data: availData, isLoading } = useQuery({
    queryKey: ['availabilities', hackathonId],
    queryFn: () => mentorshipApi.listAvailabilities({ hackathonId }),
    enabled: !!hackathonId,
  })

  const hackathons = hackData?.data.data ?? []

  // ⚠️ All hooks MUST be called before any conditional returns
  const availabilities = (availData?.data.data ?? []) as (MentorAvailability & {
    mentor?: { id: string; fullName: string; email: string; avatarUrl?: string }
    track?: { id: string; name: string }
    _count?: { slots: number }
  })[]
  const availPagination = useClientPagination(availabilities, 20)

  if (!hackathonId) {
    return (
      <div className="mx-auto max-w-xl py-20 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t.adminMentorship.title}</h2>
          <p className="text-muted-foreground">
            {lang === 'uk' ? 'Оберіть хакатон для перегляду менторів та слотів' : 'Select a hackathon to view mentors and slots'}
          </p>
        </div>
        <div className="grid gap-3">
          {hackathons.map((h) => (
            <button key={h.id} onClick={() => navigate(`/mentorship/${h.id}`)}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left hover:border-primary/50 transition-colors">
              <div>
                <h3 className="font-semibold">{h.title}</h3>
                <p className="text-sm text-muted-foreground">{formatDate(h.startDate, lang)}</p>
              </div>
              <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/mentorship')}
          className="rounded-lg border border-border p-2 hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">{lang === 'uk' ? 'Менторство хакатону' : 'Hackathon Mentorship'}</h2>
          <p className="text-sm text-muted-foreground">{lang === 'uk' ? 'Управління слотами та менторами' : 'Manage slots and mentors'}</p>
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

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : activeTab === 'mentors' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availabilities.length === 0 ? (
            <div className="col-span-full">
              <EmptyState 
                title={lang === 'uk' ? 'Немає доступностей' : 'No availabilities'} 
                description={lang === 'uk' ? 'Ментори ще не додали свої слоти.' : 'Mentors have not added their slots yet.'} 
              />
            </div>
          ) : (
            availabilities.map((avail) => (
              <div key={avail.id} className="rounded-xl border border-border bg-card p-5 space-y-4 hover:border-primary/30 transition-colors shadow-sm">
                <div className="flex items-center gap-3">
                  {avail.mentor?.avatarUrl ? (
                    <img src={avail.mentor.avatarUrl} className="h-10 w-10 rounded-full object-cover border border-border" alt="" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                      {avail.mentor?.fullName?.[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold leading-tight">{avail.mentor?.fullName}</h3>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{avail.mentor?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0 text-primary" /> 
                    <span>{formatDateTime(avail.startDatetime, lang)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0 text-primary" /> 
                    <span>{t.adminTeams.track}: <span className="font-medium text-foreground">{avail.track?.name ?? (lang === 'uk' ? 'Всі треки' : 'All tracks')}</span></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0 text-primary" /> 
                    <span>{lang === 'uk' ? 'Заброньовано' : 'Booked'}: <span className="font-bold text-foreground">{(avail as any).slots?.length ?? 0}</span> {lang === 'uk' ? 'слотів' : 'slots'}</span>
                  </div>
                </div>

                <button onClick={() => setSelectedAvailabilityId(avail.id)}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]">
                  {lang === 'uk' ? 'Переглянути слоти' : 'View slots'}
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'mentor', header: t.adminMentorship.mentors, render: (a) => <span className="font-bold">{a.mentor?.fullName}</span> },
            { key: 'track', header: t.adminTeams.track, render: (a) => (
              <span className={clsx("px-2 py-1 rounded text-xs font-bold", a.track ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                {a.track?.name ?? (lang === 'uk' ? 'Всі треки' : 'All tracks')}
              </span>
            ) },
            { key: 'start', header: t.mentor.startTime, render: (a) => <span className="text-sm font-medium">{formatDateTime(a.startDatetime, lang)}</span> },
            { key: 'end', header: t.mentor.endTime, render: (a) => <span className="text-sm text-muted-foreground">{formatDateTime(a.endDatetime, lang)}</span> },
            { key: 'slots', header: t.adminMentorship.slots, className: 'text-center', render: (a) => (
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-[10px] font-bold">
                {(a as any).slots?.length ?? 0}
              </span>
            ) },
          ]}
          data={availPagination.slice}
          total={availPagination.total}
          page={availPagination.page}
          limit={availPagination.limit}
          onPageChange={availPagination.setPage}
          onLimitChange={availPagination.setLimit}
          emptyTitle={lang === 'uk' ? 'Немає доступностей' : 'No availabilities'}
        />
      )}

      {selectedAvailabilityId && (
        <SlotDrawer availabilityId={selectedAvailabilityId} onClose={() => setSelectedAvailabilityId(null)} />
      )}
    </div>
  )
}
