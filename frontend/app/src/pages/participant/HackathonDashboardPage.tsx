import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Users, FolderKanban, GraduationCap, Trophy, Settings, ClipboardList } from 'lucide-react'
import { hackathonsApi } from '@/api/hackathons'
import { teamsApi } from '@/api/teams'
import { useAuthStore } from '@/store/auth.store'
import { useHackathonStage } from '@/hooks/useHackathonStage'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import ReactMarkdown from 'react-markdown'

import { TeamTab } from '@/pages/participant/dashboard-tabs/TeamTab'
import { ProjectTab } from '@/pages/participant/dashboard-tabs/ProjectTab'
import { MentorsTab } from '@/pages/participant/dashboard-tabs/MentorsTab'
import { ResultsTab } from '@/pages/participant/dashboard-tabs/ResultsTab'
import { SettingsTab } from '@/pages/participant/dashboard-tabs/SettingsTab'

export function HackathonDashboardPage() {
  const { hackathonId } = useParams<{ hackathonId: string }>()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'team' | 'project' | 'mentors' | 'results' | 'settings'>('team')

  const { data: hackathonData, isLoading: hackathonLoading } = useQuery({
    queryKey: ['hackathon', hackathonId],
    queryFn: () => hackathonsApi.getById(hackathonId!),
    enabled: !!hackathonId,
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
    return <div className="py-24 text-center">Хакатон не знайдено</div>
  }

  const tabs = [
    { id: 'team',     label: 'Моя команда', icon: Users },
    { id: 'project',  label: 'Проєкт',      icon: FolderKanban },
    { id: 'mentors',  label: 'Ментори',     icon: GraduationCap },
    { id: 'results',  label: 'Результати',  icon: Trophy },
    { id: 'settings', label: 'Налаштування', icon: Settings },
  ] as const

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link to="/app/hackathons" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft className="mr-1 h-4 w-4" />
          До списку хакатонів
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{hackathon.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={hackathon.status} />
              {stageInfo.activeStage && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Етап: {(stageInfo.activeStage as any).type || (stageInfo.activeStage as any).name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hacking task banner — visible ONLY during active HACKING stage with a task ── */}
      {stageInfo.activeStage &&
        (stageInfo.activeStage as any).type === 'HACKING' &&
        (stageInfo.activeStage as any).description && (
          <div className="rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <h2 className="font-bold text-amber-800 dark:text-amber-300">
                Завдання етапу: {(stageInfo.activeStage as any).name}
              </h2>
            </div>
            <div className="prose prose-sm max-w-none
              prose-headings:text-amber-900 dark:prose-headings:text-amber-200
              prose-p:text-amber-800 dark:prose-p:text-amber-300
              prose-li:text-amber-800 dark:prose-li:text-amber-300
              prose-strong:text-amber-900 dark:prose-strong:text-amber-200
              prose-a:text-amber-700 prose-code:bg-amber-100 dark:prose-code:bg-amber-900
            ">
              <ReactMarkdown>{(stageInfo.activeStage as any).description}</ReactMarkdown>
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
        {activeTab === 'project'  && <ProjectTab hackathon={hackathon} myTeam={myTeam} stageInfo={stageInfo} />}
        {activeTab === 'mentors'  && <MentorsTab hackathon={hackathon} myTeam={myTeam} stageInfo={stageInfo} />}
        {activeTab === 'results'  && <ResultsTab hackathon={hackathon} myTeam={myTeam} stageInfo={stageInfo} />}
        {activeTab === 'settings' && <SettingsTab hackathon={hackathon} myTeam={myTeam} />}
      </div>
    </div>
  )
}
