import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Trophy, UserSearch, User, FileText, Star, AlertTriangle, Calendar, Clock, Shield, X, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { judgingApi } from '@/api/judging'
import { mentorshipApi } from '@/api/mentorship'
import { teamsApi } from '@/api/teams'
import { useI18n } from '@/i18n'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const { t } = useI18n()
  const isAdmin  = user?.role === 'admin'
  const isJudge  = user?.role === 'judge'
  const isMentor = user?.role === 'mentor'

  // Close sidebar on route change (mobile)
  useEffect(() => { onClose() }, [pathname])

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
  const adminNav = [
    { name: t.adminDashboard.title, href: 'http://localhost:5173', icon: Shield,  badge: 0, badgeColor: '', external: true },
    { name: t.sidebar.profile,      href: '/app/profile',         icon: User,    badge: 0, badgeColor: '', external: false },
  ]

  const judgeNav = [
    { name: t.sidebar.judgeProjects,   href: '/app/judge/projects',   icon: FileText,      badge: unscoredCount,      badgeColor: 'bg-red-500',            external: false },
    { name: t.sidebar.judgeScores,     href: '/app/judge/scores',     icon: Star,          badge: 0,                  badgeColor: '',                      external: false },
    { name: t.sidebar.judgeConflicts,  href: '/app/judge/conflicts',  icon: AlertTriangle, badge: myConflicts.length, badgeColor: 'bg-muted-foreground/60', external: false },
    { name: t.sidebar.profile,         href: '/app/profile',          icon: User,          badge: 0,                  badgeColor: '',                      external: false },
  ]

  const mentorNav = [
    { name: t.sidebar.mentorAvailability, href: '/app/mentor/availability', icon: Calendar, badge: 0,                   badgeColor: '', external: false },
    { name: t.sidebar.mentorSlots,        href: '/app/mentor/slots',        icon: Clock,    badge: upcomingBookedSlots, badgeColor: 'bg-blue-500', external: false },
    { name: t.sidebar.profile,            href: '/app/profile',             icon: User,     badge: 0,                   badgeColor: '', external: false },
  ]


  const participantNav = [
    { name: t.sidebar.myHackathons, href: '/app/hackathons',  icon: Trophy,     badge: 0, badgeColor: '', external: false },
    { name: t.sidebar.matchmaking,  href: '/app/matchmaking', icon: UserSearch, badge: 0, badgeColor: '', external: false },
    { name: t.sidebar.profile,      href: '/app/profile',     icon: User,       badge: 0, badgeColor: '', external: false },
  ]

  const navItems = isAdmin ? adminNav : isJudge ? judgeNav : isMentor ? mentorNav : participantNav


  const sidebarContent = (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Mobile close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border md:hidden">
        <Link to="/" className="font-bold text-lg">Hack-Flow</Link>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={t.actions.close}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = !item.external && pathname.startsWith(item.href)
            const cls = `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`
            const content = (
              <>
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.external && <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" />}
                {item.badge > 0 && (
                  <span className={`${item.badgeColor} text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0`}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </>
            )
            return item.external ? (
              <a key={item.name} href={item.href} className={cls}>
                {content}
              </a>
            ) : (
              <Link key={item.name} to={item.href} className={cls}>
                {content}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex h-full">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
