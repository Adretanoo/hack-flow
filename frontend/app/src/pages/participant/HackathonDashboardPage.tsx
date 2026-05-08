import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Users, FolderKanban, GraduationCap, Trophy } from 'lucide-react'
import { hackathonsApi } from '@/api/hackathons'
import { teamsApi } from '@/api/teams'
import { useAuthStore } from '@/store/auth.store'
import { useHackathonStage } from '@/hooks/useHackathonStage'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'

import { TeamTab } from '@/pages/participant/dashboard-tabs/TeamTab'
import { ProjectTab } from '@/pages/participant/dashboard-tabs/ProjectTab'
import { MentorsTab } from '@/pages/participant/dashboard-tabs/MentorsTab'
import { ResultsTab } from '@/pages/participant/dashboard-tabs/ResultsTab'

export function HackathonDashboardPage() {
  const { hackathonId } = useParams<{ hackathonId: string }>()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'team' | 'project' | 'mentors' | 'results'>('team')

  const { data: hackathonData, isLoading: hackathonLoading } = useQuery({
    queryKey: ['hackathon', hackathonId],
    queryFn: () => hackathonsApi.getById(hackathonId!),
    enabled: !!hackathonId,
  })

  // Fetch user's own team for this hackathon specifically (not all teams)
  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['my-team', hackathonId, user?.id],
    queryFn: async () => {
      // List teams for this hackathon, then find the one where current user is a member
      const res = await teamsApi.list({ hackathon_id: hackathonId, limit: 100 })
      const allTeams = res.data?.data || []
      // Find which team the current user belongs to
      for (const team of allTeams) {
        try {
          const membersRes = await teamsApi.getMembers(team.id)
          const members = membersRes.data?.data || []
          const isMember = members.some((m: any) => m.user?.id === user?.id || m.userId === user?.id)
          if (isMember) return team
        } catch {
          // skip
        }
      }
      return null
    },
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
    { id: 'team', label: 'Моя команда', icon: Users },
    { id: 'project', label: 'Проєкт', icon: FolderKanban },
    { id: 'mentors', label: 'Ментори', icon: GraduationCap },
    { id: 'results', label: 'Результати', icon: Trophy },
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
        {activeTab === 'team' && <TeamTab hackathon={hackathon} myTeam={myTeam} stageInfo={stageInfo} />}
        {activeTab === 'project' && <ProjectTab hackathon={hackathon} myTeam={myTeam} stageInfo={stageInfo} />}
        {activeTab === 'mentors' && <MentorsTab hackathon={hackathon} myTeam={myTeam} stageInfo={stageInfo} />}
        {activeTab === 'results' && <ResultsTab hackathon={hackathon} myTeam={myTeam} stageInfo={stageInfo} />}
      </div>
    </div>
  )
}
