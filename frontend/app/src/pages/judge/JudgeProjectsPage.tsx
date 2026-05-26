import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ShieldAlert, Clock, CheckCircle, ChevronRight, Folder, Lock } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { hackathonsApi } from '@/api/hackathons'
import { judgingApi } from '@/api/judging'
import { teamsApi } from '@/api/teams'
import { formatRelativeTime } from '@/utils/format'
import { useAuthStore } from '@/store/auth.store'
import { useHackathonStage } from '@/hooks/useHackathonStage'
import { useI18n } from '@/i18n'

type Filter = 'all' | 'unscored' | 'scored' | 'conflict'

export function JudgeProjectsPage() {
  const [activeHackathonId, setActiveHackathonId] = useState<string>(
    () => localStorage.getItem('judge_hackathon') || ''
  )
  const [filter, setFilter] = useState<Filter>('all')
  const { t } = useI18n()

  const { data: hackathonsData } = useQuery({
    queryKey: ['judge-hackathons'],
    queryFn: () => hackathonsApi.list({ limit: 100 }).then(res => res.data.data),
  })

  const hackathons: any[] = hackathonsData || []

  useEffect(() => {
    if (hackathons.length > 0 && !activeHackathonId) {
      const first = hackathons[0].id
      setActiveHackathonId(first)
      localStorage.setItem('judge_hackathon', first)
    }
  }, [hackathons, activeHackathonId])

  const handleHackathonChange = (id: string) => {
    setActiveHackathonId(id)
    localStorage.setItem('judge_hackathon', id)
  }

  const { data: myTracksData } = useQuery({
    queryKey: ['my-tracks', activeHackathonId],
    queryFn: () => judgingApi.getMyTracks(activeHackathonId).then(res => res.data.data),
    enabled: !!activeHackathonId,
  })

  const myTracks: any[] = myTracksData || []
  const trackIds = myTracks.map((t: any) => t.trackId)

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['judge-teams', activeHackathonId, trackIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        trackIds.map((tid: string) =>
          teamsApi.list({ hackathon_id: activeHackathonId, track_id: tid, limit: 100 }).then(r => r.data.data)
        )
      )
      // Deduplicate by team ID — a judge may cover multiple tracks that return the same team
      const flat = results.flat()
      const seen = new Set<string>()
      return flat.filter((t: any) => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
    },
    enabled: trackIds.length > 0,
  })

  const { data: myScoresData } = useQuery({
    queryKey: ['my-scores'],
    queryFn: () => judgingApi.getMyScores().then(res => res.data.data),
  })

  const { data: myConflictsData } = useQuery({
    queryKey: ['my-conflicts'],
    queryFn: () => judgingApi.getMyConflicts().then(res => res.data.data),
  })

  const teams: any[] = teamsData || []
  const myScores: any[] = myScoresData || []
  const myConflicts: any[] = myConflictsData || []

  // Detect FINISHED stage for active hackathon
  const { data: activeHackathonData } = useQuery({
    queryKey: ['hackathon-detail', activeHackathonId],
    queryFn: () => hackathonsApi.getById(activeHackathonId).then(r => r.data.data),
    enabled: !!activeHackathonId,
  })
  const stageInfo = useHackathonStage(activeHackathonData)
  const isFinished = stageInfo.isFinished

  // Build project list enriched with score/conflict status.
  // Show any project that has been officially submitted (not a draft).
  const SUBMITTED_STATUSES = ['SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED']
  const allProjects = teams
    .filter((team: any) => team.projects?.some((p: any) => SUBMITTED_STATUSES.includes(p.status)))
    .map((team: any) => {
      const project = team.projects.find((p: any) => SUBMITTED_STATUSES.includes(p.status))
      const scored = myScores.some((s: any) => s.projectId === project.id)
      const hasConflict = myConflicts.some((c: any) => c.teamId === team.id)
      const trackName = team.track?.name || myTracks.find((t: any) => t.trackId === team.trackId)?.track?.name || t.judge.noTrack
      return { ...project, team, scored, hasConflict, trackName }
    })

  const filtered = allProjects.filter((p: any) => {
    if (filter === 'scored')   return p.scored && !p.hasConflict
    if (filter === 'unscored') return !p.scored && !p.hasConflict
    if (filter === 'conflict') return p.hasConflict
    return true
  })

  // Group by track
  const byTrack = new Map<string, any[]>()
  filtered.forEach((p: any) => {
    if (!byTrack.has(p.trackName)) byTrack.set(p.trackName, [])
    byTrack.get(p.trackName)!.push(p)
  })

  const totalProjects = allProjects.filter((p: any) => !p.hasConflict).length
  const evaluatedCount = allProjects.filter((p: any) => p.scored && !p.hasConflict).length
  const progressPercent = totalProjects > 0 ? (evaluatedCount / totalProjects) * 100 : 0
  const conflictsCount = allProjects.filter((p: any) => p.hasConflict).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + hackathon selector */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader
          title={t.judge.projects}
          subtitle={t.sidebar.judgeProjects}
        />
        {hackathons.length > 1 ? (
          <select
            value={activeHackathonId}
            onChange={e => handleHackathonChange(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm min-w-[200px] shrink-0"
          >
            <option value="">{t.judge.selectHackathonPlaceholder}</option>
            {hackathons.map((h: any) => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        ) : hackathons.length === 1 ? (
          <span className="shrink-0 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {hackathons[0].title}
          </span>
        ) : null}
      </div>

      {!activeHackathonId ? (
        <EmptyState title={t.judge.selectHackathon} description={t.judge.selectHackathon} />
      ) : myTracks.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">{t.judge.notAssignedToTrack}</p>
            <p className="text-sm text-amber-700 mt-1">
              {t.judge.contactOrganizerForTrack}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* FINISHED stage banner */}
          {isFinished && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">{t.judge.hackathonFinishedJudgingClosed}</p>
                <p className="text-sm text-blue-700 mt-0.5">{t.judge.canViewCannotEditScores}</p>
              </div>
            </div>
          )}

          {/* My tracks banner */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t.judge.youAreJudgeOfTracks}</span>
            {myTracks.map((t: any) => (
              <span key={t.trackId} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {t.track?.name || t.teamTab.track}
              </span>
            ))}
          </div>

          {/* Progress */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{t.judge.judgingProgress}</span>
              <span className="text-muted-foreground font-mono">{evaluatedCount} {t.judge.of} {totalProjects} {t.judge.projectsCount(totalProjects)}</span>
            </div>
            <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-right text-xs text-muted-foreground">{Math.round(progressPercent)}% {t.judge.completed}</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-border pb-1">
            {([
            { key: 'all',      label: t.states.all,          count: allProjects.length },
              { key: 'unscored', label: t.judge.noScores,       count: allProjects.filter((p:any) => !p.scored && !p.hasConflict).length },
              { key: 'scored',   label: t.judge.scores,         count: evaluatedCount },
              { key: 'conflict', label: t.judge.conflicts,       count: conflictsCount },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as Filter)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                    filter === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Projects */}
          {teamsLoading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t.judge.noProjects}
              description={t.judge.noProjectsDesc}
            />
          ) : (
            <div className="space-y-6">
              {Array.from(byTrack.entries()).map(([trackName, projects]) => (
                <div key={trackName} className="space-y-3">
                  {/* Track header */}
                  {myTracks.length > 1 && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Folder className="h-4 w-4" />
                      <span>{trackName}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        ({projects.length} {projects.length === 1 ? t.judge.projectSingular : t.judge.projectPlural})
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {projects.map((project: any) => (
                      <ProjectCard key={project.id} project={project} isFinished={isFinished} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ProjectCard({ project, isFinished }: { project: any; isFinished: boolean }) {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const submittedAgo = project.submittedAt ? formatRelativeTime(project.submittedAt) : null
  const { t } = useI18n()

  return (
    <div className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md ${
      project.hasConflict ? 'border-amber-200 opacity-80' : 'border-border'
    }`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{project.title || t.judge.untitled}</h3>
              {project.hasConflict && (
                <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <AlertTriangle className="h-3 w-3" /> {t.judge.hasConflict}
                </span>
              )}
              {project.scored && !project.hasConflict && (
                <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3" /> {t.judge.scored}
                </span>
              )}
              {!project.scored && !project.hasConflict && (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {t.judge.notEvaluated}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t.judge.teamLabel}<span className="font-medium text-foreground">{project.team.name}</span></p>
            {submittedAgo && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {t.judge.submitted} {submittedAgo}
              </p>
            )}
          </div>

          {project.hasConflict ? (
            <div className="shrink-0 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <ShieldAlert className="h-4 w-4" />
              {t.judge.evaluationUnavailable}
            </div>
          ) : (
              <Link
                to={`/app/judge/score/${project.id}`}
                className={`shrink-0 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isFinished
                    ? 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isFinished ? t.actions.view : isAdmin ? t.judge.scores : project.scored ? t.actions.edit : t.actions.score}
                <ChevronRight className="h-4 w-4" />
              </Link>
          )}
        </div>

        {/* Score progress bar */}
        {!project.hasConflict && (
          <div className="mt-4">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${project.scored ? 'bg-green-500 w-full' : 'w-0'}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
