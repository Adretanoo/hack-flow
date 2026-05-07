import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { hackathonsApi } from '@/api/hackathons'
import { judgingApi } from '@/api/judging'
import { teamsApi } from '@/api/teams'
import { formatDate } from '@/utils/format'

export function JudgeProjectsPage() {
  const [activeHackathonId, setActiveHackathonId] = useState<string>(() => localStorage.getItem('judge_active_hackathon') || '')
  const [filter, setFilter] = useState<'all' | 'scored' | 'unscored'>('all')

  const { data: hackathonsData } = useQuery({
    queryKey: ['judge-hackathons'],
    queryFn: () => hackathonsApi.list({ limit: 100 }).then(res => res.data.data)
  })

  // We fetch hackathons first to populate the selector. If only one exists, auto-select it.
  useEffect(() => {
    if (hackathonsData && hackathonsData.length > 0 && !activeHackathonId) {
      setActiveHackathonId(hackathonsData[0].id)
    }
  }, [hackathonsData, activeHackathonId])

  useEffect(() => {
    if (activeHackathonId) localStorage.setItem('judge_active_hackathon', activeHackathonId)
  }, [activeHackathonId])

  // Fetch my tracks for this hackathon
  const { data: myTracksData } = useQuery({
    queryKey: ['my-tracks', activeHackathonId],
    queryFn: () => judgingApi.getMyTracks(activeHackathonId).then(res => res.data.data),
    enabled: !!activeHackathonId
  })

  const myTracks = myTracksData || []
  const trackIds = myTracks.map((t: any) => t.trackId)

  // Fetch teams for those tracks
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['judge-teams', activeHackathonId, trackIds],
    queryFn: async () => {
      // Fetch teams for all assigned tracks
      const promises = trackIds.map((tid: string) => teamsApi.list({ hackathon_id: activeHackathonId, track_id: tid, limit: 100 }))
      const results = await Promise.all(promises)
      return results.flatMap(r => r.data.data)
    },
    enabled: trackIds.length > 0
  })

  // Fetch my scores to see what's evaluated
  const { data: myScoresData } = useQuery({
    queryKey: ['my-scores'],
    queryFn: () => judgingApi.getMyScores().then(res => res.data.data)
  })

  // Fetch my conflicts
  const { data: myConflictsData } = useQuery({
    queryKey: ['my-conflicts'],
    queryFn: () => judgingApi.getMyConflicts().then(res => res.data.data)
  })

  const teams = teamsData || []
  const myScores = myScoresData || []
  const myConflicts = myConflictsData || []

  const projects = teams
    .filter((team: any) => team.projects && team.projects.length > 0)
    .map((team: any) => {
      const project = team.projects[0]
      // A project is considered scored by me if I have at least one score for it
      const scored = myScores.some((s: any) => s.projectId === project.id)
      const hasConflict = myConflicts.some((c: any) => c.teamId === team.id)
      return {
        ...project,
        team,
        scored,
        hasConflict
      }
    })
    .filter((p: any) => {
      if (filter === 'scored') return p.scored
      if (filter === 'unscored') return !p.scored
      return true
    })

  const totalProjects = teams.filter((t: any) => t.projects && t.projects.length > 0).length
  const evaluatedCount = teams.filter((t: any) => t.projects && t.projects.length > 0 && myScores.some((s: any) => s.projectId === t.projects[0].id)).length
  const progressPercent = totalProjects > 0 ? (evaluatedCount / totalProjects) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Мої проєкти для оцінювання" subtitle="Переглядайте та оцінюйте проєкти команд з ваших треків" />
        
        {hackathonsData && hackathonsData.length > 0 && (
          <select 
            value={activeHackathonId} 
            onChange={e => setActiveHackathonId(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm min-w-[200px]"
          >
            <option value="">Оберіть хакатон...</option>
            {hackathonsData.map((h: any) => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        )}
      </div>

      {!activeHackathonId ? (
        <EmptyState title="Хакатон не обрано" description="Будь ласка, оберіть хакатон зі списку вище" />
      ) : myTracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Ви не призначені на жоден трек</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Організатори хакатону ще не призначили вам трек для оцінювання. Зверніться до адміністратора.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Ваші треки:</span>
            {myTracks.map((t: any) => (
              <span key={t.trackId} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                {t.track?.name || 'Трек'}
              </span>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Оцінено {evaluatedCount} з {totalProjects} проєктів</span>
              <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Всі</button>
              <button onClick={() => setFilter('unscored')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'unscored' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Не оцінені</button>
              <button onClick={() => setFilter('scored')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'scored' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Оцінені</button>
            </div>
          </div>

          {teamsLoading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : projects.length === 0 ? (
            <EmptyState title="Проєктів не знайдено" description="Команди ще не створили проєкти або не відповідають фільтру" />
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Проєкт / Команда</th>
                      <th className="px-6 py-4 font-semibold">Подано</th>
                      <th className="px-6 py-4 font-semibold">Статус</th>
                      <th className="px-6 py-4 font-semibold text-right">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {projects.map((project: any) => (
                      <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {project.title}
                            {project.hasConflict && (
                              <span title="Конфлікт інтересів" className="inline-flex items-center text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{project.team.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {project.submittedAt ? formatDate(project.submittedAt) : 'Не подано'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {project.scored ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Оцінено
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              Не оцінено
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link 
                            to={`/app/judge/score/${project.id}`}
                            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                              project.hasConflict 
                                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                            onClick={e => {
                              if (project.hasConflict) e.preventDefault()
                            }}
                            title={project.hasConflict ? 'Є конфлікт інтересів' : 'Перейти до оцінювання'}
                          >
                            {project.scored ? 'Редагувати' : 'Оцінити'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
