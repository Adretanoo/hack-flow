import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Users, FolderKanban, GraduationCap, Trophy, Settings, ClipboardList, Calendar, ArrowRight } from 'lucide-react'
import { hackathonsApi } from '@/api/hackathons'
import { teamsApi } from '@/api/teams'
import { useAuthStore } from '@/store/auth.store'
import { useHackathonStage } from '@/hooks/useHackathonStage'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { formatDateTime } from '@/utils/format'
import { useI18n } from '@/i18n'

import { TeamTab } from '@/pages/participant/dashboard-tabs/TeamTab'
import { ProjectTab } from '@/pages/participant/dashboard-tabs/ProjectTab'
import { MentorsTab } from '@/pages/participant/dashboard-tabs/MentorsTab'
import { ResultsTab } from '@/pages/participant/dashboard-tabs/ResultsTab'
import { SettingsTab } from '@/pages/participant/dashboard-tabs/SettingsTab'

export function HackathonDashboardPage() {
  const { hackathonId } = useParams<{ hackathonId: string }>()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'team' | 'project' | 'mentors' | 'results' | 'settings'>('team')
  const { t } = useI18n()

  const { data: hackathonData, isLoading: hackathonLoading } = useQuery({
    queryKey: ['hackathon', hackathonId],
    queryFn: () => hackathonsApi.getById(hackathonId!),
    enabled: !!hackathonId,
    refetchInterval: 60_000,   // re-check every minute for stage transitions
    staleTime: 30_000,
  })

  // Fetch user's own team with full approval data
  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['my-team', hackathonId, user?.id],
    queryFn: () => teamsApi.getMyTeam(hackathonId!).then(res => res.data?.data ?? null),
    enabled: !!hackathonId && !!user?.id,
  })

  const hackathon = hackathonData?.data?.data
  const myTeam = teamData ?? undefined
  const stageInfo = useHackathonStage(hackathon)

  if (hackathonLoading || teamLoading) {
    return <div className="py-24"><LoadingSpinner size="lg" /></div>
  }

  if (!hackathon) {
    return <div className="py-24 text-center">{t.dashboard.notFound}</div>
  }

  const tabs = [
    { id: 'team',     label: t.dashboard.tabTeam,     icon: Users },
    { id: 'project',  label: t.dashboard.tabProject,   icon: FolderKanban },
    { id: 'mentors',  label: t.dashboard.tabMentors,   icon: GraduationCap },
    { id: 'results',  label: t.dashboard.tabResults,   icon: Trophy },
    { id: 'settings', label: t.dashboard.tabSettings,  icon: Settings },
  ] as const

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link to="/app/hackathons" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t.dashboard.backToList}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{hackathon.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StatusBadge status={
                hackathon.status === 'PUBLISHED' 
                  ? (new Date() > new Date(hackathon.endDate) || stageInfo.activeStageType === 'FINISHED' ? 'past' : (new Date() < new Date(hackathon.startDate) ? 'upcoming' : 'active'))
                  : hackathon.status
              } />
              {stageInfo.activeStage && stageInfo.activeStageType && (() => {
                const STAGE_LABELS: Record<string, string> = {
                  REGISTRATION: t.dashboard.stages.REGISTRATION,
                  HACKING:      t.dashboard.stages.HACKING,
                  PRESENTATION: '🎤 Presentation',
                  JUDGING:      t.dashboard.stages.JUDGING,
                  FINISHED:     t.dashboard.stages.FINISHED,
                  CUSTOM:       stageInfo.activeStage.name,
                }
                const label = STAGE_LABELS[stageInfo.activeStageType] ?? stageInfo.activeStage.name
                return (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {t.dashboard.stageLabel}: {label}
                  </span>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hacking task banner — visible ONLY during active HACKING stage with a task ── */}
      {stageInfo.activeStageType === 'HACKING' &&
        (stageInfo.activeStage as any).description && (
          <div className="rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700/40 overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-amber-100/60 dark:bg-amber-900/20 border-b border-amber-200/60 dark:border-amber-700/30">
              <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <h2 className="font-bold text-sm text-amber-800 dark:text-amber-300">
                {t.dashboard.stageTask}: {(stageInfo.activeStage as any).name}
              </h2>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-amber-200/60 dark:border-amber-700/30">
              <Calendar className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <div className="flex flex-col items-center bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-1.5 text-center">
                  <span className="text-amber-500 dark:text-amber-400 font-medium uppercase tracking-wide" style={{fontSize:'9px'}}>{t.publicHackathon.startDate.toUpperCase()}</span>
                  <span className="font-bold text-amber-900 dark:text-amber-200 tabular-nums">
                    {formatDateTime((stageInfo.activeStage as any).startDate)}
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <div className="flex flex-col items-center bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-1.5 text-center">
                  <span className="text-amber-500 dark:text-amber-400 font-medium uppercase tracking-wide" style={{fontSize:'9px'}}>{t.publicHackathon.endDate.toUpperCase()}</span>
                  <span className="font-bold text-amber-900 dark:text-amber-200 tabular-nums">
                    {formatDateTime((stageInfo.activeStage as any).endDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              <div className="prose prose-sm max-w-none
                prose-headings:text-amber-900 dark:prose-headings:text-amber-200
                prose-p:text-amber-800 dark:prose-p:text-amber-300
                prose-li:text-amber-800 dark:prose-li:text-amber-300
                prose-strong:text-amber-900 dark:prose-strong:text-amber-200
                prose-a:text-amber-700 prose-code:bg-amber-100 dark:prose-code:bg-amber-900
                prose-img:rounded-lg prose-img:mx-auto
              ">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{(stageInfo.activeStage as any).description}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="pt-2">
        {activeTab === 'team'     && <TeamTab hackathon={hackathon} myTeam={myTeam} stageInfo={stageInfo} />}
        {activeTab === 'project'  && <ProjectTab myTeam={myTeam} stageInfo={stageInfo} />}
        {activeTab === 'mentors'  && <MentorsTab hackathon={hackathon} myTeam={myTeam} stageInfo={stageInfo} />}
        {activeTab === 'results'  && <ResultsTab hackathon={hackathon} myTeam={myTeam} stageInfo={stageInfo} />}
        {activeTab === 'settings' && <SettingsTab hackathon={hackathon} myTeam={myTeam} />}
      </div>
    </div>
  )
}
