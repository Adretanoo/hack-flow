import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { hackathonsApi } from '@/api/hackathons'
import { teamsApi } from '@/api/teams'
import { useAuthStore } from '@/store/auth.store'
import { HackathonCard } from '@/components/shared/HackathonCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { useI18n } from '@/i18n'

export function HackathonsPage() {
  const [activeTab, setActiveTab] = useState<'my' | 'find'>('my')
  const { t } = useI18n()

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t.hackathonsPage.title} />

      <div className="flex space-x-1 rounded-xl bg-muted/50 p-1 w-full max-w-sm">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === 'my'
              ? 'bg-background text-foreground shadow'
              : 'text-muted-foreground hover:bg-background/50'
          }`}
        >
          {t.hackathonsPage.myHackathons}
        </button>
        <button
          onClick={() => setActiveTab('find')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === 'find'
              ? 'bg-background text-foreground shadow'
              : 'text-muted-foreground hover:bg-background/50'
          }`}
        >
          {t.hackathonsPage.findHackathon}
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'my' ? <MyHackathonsList /> : <FindHackathonList />}
      </div>
    </div>
  )
}

function MyHackathonsList() {
  const { user } = useAuthStore()
  const { t } = useI18n()

  const { data, isLoading } = useQuery({
    queryKey: ['my-teams', user?.id],
    queryFn: () => teamsApi.getMyTeams().then(res => res.data?.data ?? []),
    enabled: !!user?.id,
  })

  const teams = data ?? []

  if (isLoading) return <div className="py-24"><LoadingSpinner /></div>

  if (teams.length === 0) {
    return (
      <EmptyState
        title={t.hackathonsPage.noMyHackathons}
        description={t.hackathonsPage.noMyHackathonsDesc}
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => {
        const latestApproval = (team as any).approvals?.[0]
        const status = latestApproval?.status ?? 'PENDING'
        const statusColor =
          status === 'APPROVED' ? 'bg-green-100 text-green-700' :
          status === 'REJECTED' ? 'bg-red-100 text-red-700' :
          status === 'DISQUALIFIED' ? 'bg-orange-100 text-orange-700' :
          'bg-amber-100 text-amber-700'
        const statusLabel = t.hackathonsPage.status[status as keyof typeof t.hackathonsPage.status] ?? status

        return (
          <div key={team.id} className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md hover:-translate-y-1">
            <div className="p-5 flex flex-col h-full">
              <div className="mb-3 flex justify-between items-start">
                <span className={`px-2 py-1 text-xs font-medium rounded-md ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
              <h3 className="mb-1 text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                <Link to={`/app/hackathons/${team.hackathonId}`} className="focus:outline-none">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {(team.hackathon as any)?.title ?? '—'}
                </Link>
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-2 border-t border-border pt-2">
                {t.hackathonsPage.teamLabel}: <span className="text-foreground">{team.name}</span>
              </p>
              {(team.track as any)?.name && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t.hackathonsPage.trackLabel}: {(team.track as any).name}
                </p>
              )}
              {latestApproval?.comment && (status === 'REJECTED' || status === 'DISQUALIFIED') && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                  {latestApproval.comment}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FindHackathonList() {
  const [search, setSearch] = useState('')
  const { t } = useI18n()

  const { data, isLoading } = useQuery({
    queryKey: ['public-hackathons', search],
    queryFn: () => hackathonsApi.list({
      publishStatus: 'PUBLISHED',
      search: search || undefined,
      limit: 20
    }),
  })

  const hackathons = data?.data?.data || []

  return (
    <div className="space-y-6">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t.hackathonsPage.searchPlaceholder}
          className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="py-24"><LoadingSpinner /></div>
      ) : hackathons.length === 0 ? (
        <EmptyState
          title={t.hackathonsPage.noAvailableHackathons}
          description={t.hackathonsPage.noAvailableHackathonsDesc}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hackathons.map((hackathon) => (
            <div key={hackathon.id} className="relative h-full">
              <HackathonCard hackathon={hackathon} />
              <div className="absolute top-3 right-3 z-10">
                <Link to={`/hackathons/${hackathon.id}`} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md shadow-sm hover:bg-primary/90 transition-colors pointer-events-auto">
                  {t.hackathonsPage.join}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
