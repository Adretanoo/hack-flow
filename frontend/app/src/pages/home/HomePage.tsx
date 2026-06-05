import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Archive } from 'lucide-react'
import { hackathonsApi } from '@/api/hackathons'
import { useAuthStore } from '@/store/auth.store'
import { HackathonCard } from '@/components/shared/HackathonCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useI18n } from '@/i18n'

export function HomePage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('')
  const [search, setSearch] = useState('')
  const { t } = useI18n()

  const TABS = [
    { id: '', label: t.homePage.tabAll, icon: null },
    { id: 'active', label: t.homePage.tabActive, icon: null },
    { id: 'upcoming', label: t.homePage.tabUpcoming, icon: null },
    { id: 'past', label: t.homePage.tabPast, icon: null },
    { id: 'archived', label: t.homePage.tabArchived, icon: Archive },
  ]

  const isArchiveTab = activeTab === 'archived'

  const { data, isLoading } = useQuery({
    queryKey: ['public-hackathons', activeTab, search],
    queryFn: () => hackathonsApi.list({
      status: (!isArchiveTab && activeTab) ? activeTab : undefined,
      search: search || undefined,
      publishStatus: isArchiveTab ? 'ARCHIVED' : 'PUBLISHED',
      limit: 20
    }),
  })

  const hackathons = data?.data?.data || []

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary/5 px-6 py-16 text-center sm:px-12 sm:py-24">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            {t.homePage.heroTitle.split('Hack-Flow')[0]}
            <span className="text-primary">Hack-Flow</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {t.homePage.heroSubtitle}
          </p>
          {!user && (
            <div className="flex justify-center gap-4 pt-4">
              <Link to="/register" className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all">
                {t.homePage.registerCTA}
              </Link>
              <Link to="/login" className="rounded-full bg-background px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent transition-all">
                {t.nav.login}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Filter Bar */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold">{t.nav.hackathons}</h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t.homePage.searchPlaceholder}
                className="h-10 w-full sm:w-64 rounded-full border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === tab.id
                      ? tab.id === 'archived'
                        ? 'bg-amber-600 text-white'
                        : 'bg-foreground text-background'
                      : tab.id === 'archived'
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-900/50'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                  {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="py-24"><LoadingSpinner size="lg" /></div>
        ) : hackathons.length === 0 ? (
          <EmptyState
            title={t.homePage.noHackathons}
            description={t.homePage.noHackathonsDesc}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((hackathon) => (
              <div key={hackathon.id} className="h-full">
                <HackathonCard hackathon={hackathon} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
