import { Link, useLocation } from 'react-router-dom'
import { Trophy, UserSearch, User, FileText, Star, AlertTriangle, Calendar, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { judgingApi } from '@/api/judging'
import { mentorshipApi } from '@/api/mentorship'
import { teamsApi } from '@/api/teams'

export function Sidebar() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const isJudge  = user?.role === 'judge'  || user?.role === 'admin'
  const isMentor = user?.role === 'mentor' || user?.role === 'admin'

  // ── Judge badge data ───────────────────────────────────────────
  const judgeHackathonId = typeof window !== 'undefined' ? localStorage.getItem('judge_hackathon') || '' : ''

  const { data: myTracksData } = useQuery({
    queryKey: ['my-tracks', judgeHackathonId],
    queryFn: () => judgingApi.getMyTracks(judgeHackathonId).then(r => r.data.data),
    enabled: isJudge && !!judgeHackathonId,
  })
  const trackIds: string[] = (myTracksData || []).map((t: any) => t.trackId)

  const { data: teamsData } = useQuery({
    queryKey: ['judge-teams', judgeHackathonId, trackIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        trackIds.map((tid: string) => teamsApi.list({ hackathon_id: judgeHackathonId, track_id: tid, limit: 100 }).then(r => r.data.data))
      )
      return results.flat()
    },
    enabled: isJudge && trackIds.length > 0,
  })
  const { data: myScoresData } = useQuery({
    queryKey: ['my-scores'],
    queryFn: () => judgingApi.getMyScores().then(r => r.data.data),
    enabled: isJudge,
  })
  const { data: myConflictsData } = useQuery({
    queryKey: ['my-conflicts'],
    queryFn: () => judgingApi.getMyConflicts().then(r => r.data.data),
    enabled: isJudge,
  })

  const teams: any[]       = teamsData || []
  const myScores: any[]    = myScoresData || []
  const myConflicts: any[] = myConflictsData || []
  const conflictTeamIds    = new Set(myConflicts.map((c: any) => c.teamId))
  const unscoredCount      = teams.filter((t: any) => t.projects?.length > 0 && !conflictTeamIds.has(t.id) && !myScores.some((s: any) => s.projectId === t.projects[0].id)).length

  // ── Mentor badge data ──────────────────────────────────────────
  const { data: mentorAvailData } = useQuery({
    queryKey: ['my-availabilities'],
    queryFn: () => mentorshipApi.getMyAvailabilities().then(r => r.data.data),
    enabled: isMentor,
  })
  const upcomingBookedSlots = isMentor
    ? ((mentorAvailData as any[] || []).flatMap((av: any) => av.slots || []).filter((s: any) => s.status === 'booked' && new Date(s.startDatetime) > new Date()).length)
    : 0

  // ── Nav items ──────────────────────────────────────────────────
  const judgeNav = [
    { name: 'Проєкти',    href: '/app/judge/projects',   icon: FileText,      badge: unscoredCount,       badgeColor: 'bg-red-500' },
    { name: 'Мої оцінки', href: '/app/judge/scores',     icon: Star,          badge: 0,                   badgeColor: '' },
    { name: 'Конфлікти',  href: '/app/judge/conflicts',  icon: AlertTriangle, badge: myConflicts.length,  badgeColor: 'bg-muted-foreground/60' },
    { name: 'Профіль',    href: '/app/profile',          icon: User,          badge: 0,                   badgeColor: '' },
  ]

  const mentorNav = [
    { name: 'Розклад',  href: '/app/mentor/availability', icon: Calendar, badge: 0,                   badgeColor: '' },
    { name: 'Сесії',    href: '/app/mentor/slots',        icon: Clock,    badge: upcomingBookedSlots, badgeColor: 'bg-blue-500' },
    { name: 'Профіль',  href: '/app/profile',             icon: User,     badge: 0,                   badgeColor: '' },
  ]

  const participantNav = [
    { name: 'Хакатони',      href: '/app/hackathons',  icon: Trophy,     badge: 0, badgeColor: '' },
    { name: 'Пошук команди', href: '/app/matchmaking', icon: UserSearch, badge: 0, badgeColor: '' },
    { name: 'Профіль',       href: '/app/profile',     icon: User,       badge: 0, badgeColor: '' },
  ]

  const navItems = isJudge ? judgeNav : isMentor ? mentorNav : participantNav

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge > 0 && (
                  <span className={`${item.badgeColor} text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0`}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
