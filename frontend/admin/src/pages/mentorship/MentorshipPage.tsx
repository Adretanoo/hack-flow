import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { mentorshipApi } from '@/api/mentorship'
import { hackathonsApi } from '@/api/hackathons'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataTable } from '@/components/shared/DataTable'
import { SlotDrawer } from './components/SlotDrawer'
import { formatDate, formatDateTime } from '@/utils/format'
import { ArrowLeft, User, Calendar, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import type { MentorAvailability } from '@/types/api.types'

type Tab = 'mentors' | 'availabilities'
const TABS: { key: Tab; label: string }[] = [
  { key: 'mentors', label: 'Ментори' },
  { key: 'availabilities', label: 'Доступності' },
]

import { usePageTitle } from '@/hooks/usePageTitle'

export function MentorshipPage() {
  usePageTitle('Менторство')
  const { hackathonId } = useParams<{ hackathonId: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('mentors')
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string | null>(null)

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
  
  if (!hackathonId) {
    return (
      <div className="mx-auto max-w-xl py-20 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Менторство</h2>
          <p className="text-muted-foreground">Оберіть хакатон для перегляду менторів та слотів</p>
        </div>
        <div className="grid gap-3">
          {hackathons.map((h) => (
            <button key={h.id} onClick={() => navigate(`/mentorship/${h.id}`)}
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

  const availabilities = (availData?.data.data ?? []) as (MentorAvailability & {
    mentor?: { id: string; fullName: string; email: string; avatarUrl?: string }
    track?: { id: string; name: string }
    _count?: { slots: number }
  })[]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/mentorship')}
          className="rounded-lg border border-border p-2 hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">Менторство хакатону</h2>
          <p className="text-sm text-muted-foreground">Управління слотами та менторами</p>
        </div>
      </div>

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

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : activeTab === 'mentors' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availabilities.length === 0 ? (
            <div className="col-span-full"><EmptyState title="Немає доступностей" description="Ментори ще не додали свої слоти." /></div>
          ) : (
            availabilities.map((avail) => (
              <div key={avail.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  {avail.mentor?.avatarUrl ? (
                    <img src={avail.mentor.avatarUrl} className="h-10 w-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {avail.mentor?.fullName?.[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold leading-tight">{avail.mentor?.fullName}</h3>
                    <p className="text-xs text-muted-foreground">{avail.mentor?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> {formatDateTime(avail.startDatetime)}</div>
                  {avail.track && <div className="flex items-center gap-2"><User className="h-4 w-4 shrink-0" /> Трек: {avail.track.name}</div>}
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0" /> Заброньовано слотів: {avail._count?.slots ?? 0}</div>
                </div>

                <button onClick={() => setSelectedAvailabilityId(avail.id)}
                  className="w-full rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
                  Переглянути слоти
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'mentor', header: 'Ментор', render: (a) => <span className="font-medium">{a.mentor?.fullName}</span> },
            { key: 'track', header: 'Трек', render: (a) => <span className="text-muted-foreground">{a.track?.name ?? '—'}</span> },
            { key: 'start', header: 'Початок', render: (a) => <span>{formatDateTime(a.startDatetime)}</span> },
            { key: 'end', header: 'Кінець', render: (a) => <span>{formatDateTime(a.endDatetime)}</span> },
            { key: 'slots', header: 'Слоти', render: (a) => <span>{a._count?.slots ?? 0}</span> },
          ]}
          data={availabilities}
          emptyTitle="Немає доступностей"
        />
      )}

      {selectedAvailabilityId && (
        <SlotDrawer availabilityId={selectedAvailabilityId} onClose={() => setSelectedAvailabilityId(null)} />
      )}
    </div>
  )
}
