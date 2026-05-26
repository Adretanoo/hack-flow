import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ExternalLink, Code2, MonitorPlay, FileText, CheckCircle, RotateCcw, Users, BookOpen, Save, Lock } from 'lucide-react'
import { judgingApi } from '@/api/judging'
import { projectsApi } from '@/api/projects'
import { teamsApi } from '@/api/teams'
import { hackathonsApi } from '@/api/hackathons'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelativeTime } from '@/utils/format'
import { useAuthStore } from '@/store/auth.store'
import { useHackathonStage } from '@/hooks/useHackathonStage'
import { useI18n } from '@/i18n'

export function JudgeScorePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { t } = useI18n()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [tab, setTab] = useState<'project' | 'team'>('project')
  const [assessments, setAssessments] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [draftBanner, setDraftBanner] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const draftKey = `draft_score_${projectId}_${user?.id}`

  const { data: projectData, isLoading: pLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId!).then(r => r.data.data),
    enabled: !!projectId,
  })
  const { data: teamData } = useQuery({
    queryKey: ['team-by-id', projectData?.teamId],
    queryFn: () => teamsApi.getById(projectData!.teamId!).then(r => r.data.data),
    enabled: !!projectData?.teamId,
  })
  const { data: membersData } = useQuery({
    queryKey: ['team-members', projectData?.teamId],
    queryFn: () => teamsApi.getMembers(projectData!.teamId).then(r => r.data.data),
    enabled: !!projectData?.teamId,
  })
  const { data: criteriaData, isLoading: cLoading } = useQuery({
    queryKey: ['criteria', teamData?.trackId],
    queryFn: () => judgingApi.getCriteriaByTrack(teamData!.trackId!).then(r => r.data.data),
    enabled: !!teamData?.trackId,
  })
  const { data: myScoresData } = useQuery({
    queryKey: ['my-scores'],
    queryFn: () => judgingApi.getMyScores().then(res => res.data.data),
  })

  const { data: allScoresData } = useQuery({
    queryKey: ['project-all-scores', projectId],
    queryFn: () => judgingApi.getTeamScores(projectId!).then(r => r.data.data),
    enabled: isAdmin && !!projectId,
  })

  // Detect FINISHED stage
  const hackathonId = (teamData as any)?.hackathonId
  const { data: hackathonData } = useQuery({
    queryKey: ['hackathon-detail', hackathonId],
    queryFn: () => hackathonsApi.getById(hackathonId!).then(r => r.data.data),
    enabled: !!hackathonId,
  })
  const stageInfo = useHackathonStage(hackathonData)
  const isFinished = stageInfo.isFinished

  const criteria: any[] = criteriaData || []
  const members: any[] = membersData || []
  const myScores: any[] = myScoresData || []
  const allScores: any[] = allScoresData || []
  const existing = myScores.filter((s: any) => s.projectId === projectId)
  const hasExisting = existing.length > 0

  useEffect(() => {
    if (hasExisting && !isAdmin) {
      const init: Record<string, number> = {}
      existing.forEach((s: any) => { init[s.criteriaId] = Number(s.assessment) })
      setAssessments(init)
      setComment(existing[0]?.comment || '')
    } else if (!isAdmin) {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        try { const p = JSON.parse(raw); if (p.assessments) setDraftBanner(p.savedAt || '') } catch (_) {}
      }
    }
  }, [hasExisting, isAdmin]) // eslint-disable-line

  const saveDraft = useCallback((a: Record<string, number>, c: string) => {
    if (isAdmin) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (!hasExisting) localStorage.setItem(draftKey, JSON.stringify({ assessments: a, comment: c, savedAt: new Date().toISOString() }))
    }, 1000)
  }, [draftKey, hasExisting, isAdmin])

  const handleSlider = (id: string, v: number) => setAssessments(prev => { const next = { ...prev, [id]: v }; saveDraft(next, comment); return next })
  const handleComment = (v: string) => { setComment(v); saveDraft(assessments, v) }

  const submitMut = useMutation({
    mutationFn: async () => { for (const c of criteria) await judgingApi.submitScore({ projectId: projectId!, criteriaId: c.id, assessment: assessments[c.id] ?? 0, comment }) },
    onSuccess: () => { localStorage.removeItem(draftKey); qc.invalidateQueries({ queryKey: ['my-scores'] }); setDone(true); setTimeout(() => navigate('/app/judge/projects'), 1500) },
    onError: (e: any) => alert(e.message || t.states.error),
  })

  useEffect(() => {
    if (isAdmin) return
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !submitMut.isPending) { e.preventDefault(); submitMut.mutate() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [submitMut, isAdmin])

  let total = 0
  criteria.forEach((c: any) => { total += (assessments[c.id] ?? 0) * Number(c.weight) })

  // Group scores by judge for admin view
  const scoresByJudge = useMemo(() => {
    const map = new Map<string, { judgeId: string; judge: any; total: number; assessments: any[] }>()
    allScores.forEach((s: any) => {
      if (!map.has(s.judgeId)) {
        map.set(s.judgeId, { judgeId: s.judgeId, judge: s.judge, total: 0, assessments: [] })
      }
      const entry = map.get(s.judgeId)!
      const crit = criteria.find((c: any) => c.id === s.criteriaId)
      if (crit) {
        entry.total += Number(s.assessment) * Number(crit.weight)
      }
      entry.assessments.push(s)
    })
    return Array.from(map.values())
  }, [allScores, criteria])

  if (pLoading || cLoading) return <div className="py-24"><LoadingSpinner /></div>
  if (!projectData) return null
  const proj = projectData as any

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-4 pb-24">
      <Link to="/app/judge/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t.judge.backToList}
      </Link>

      {done && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3 text-green-800">
          <CheckCircle className="h-5 w-5" /><span className="font-semibold">{t.judge.scoreUpdated}</span>
        </div>
      )}

      {isFinished && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">{t.judge.hackathonFinishedJudgingClosed}</p>
            <p className="text-sm text-blue-700">{t.judge.canViewCannotEditScores}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT */}
        <div className="lg:w-3/5 space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h1 className="text-2xl font-bold">{proj.title || t.resultsTab.project}</h1>
            <div className="flex flex-wrap gap-2">
              {teamData && <span className="px-3 py-1 rounded-full bg-accent text-sm font-medium">{(teamData as any).name}</span>}
              {(teamData as any)?.track?.name && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{(teamData as any).track.name}</span>}
            </div>
          </div>

          <div className="flex gap-1 border-b border-border">
            {([{ k: 'project', Icon: BookOpen, label: t.resultsTab.project }, { k: 'team', Icon: Users, label: t.resultsTab.team }] as const).map(({ k, Icon, label }) => (
              <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === k ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>

          {tab === 'project' && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div>
                <h3 className="font-semibold mb-2">{t.projectTab.description}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{proj.description || t.judge.descriptionMissing}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">{t.projectTab.resourcesTitle}</h3>
                {!proj.resources?.length ? <p className="text-sm text-muted-foreground">{t.judge.noResourcesSubmitted}</p> : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {proj.resources.map((r: any) => {
                      const type = r.type?.name || r.projectType?.name || ''
                      const isGh = type.includes('repo') || r.url?.includes('github')
                      const isDm = type.includes('demo') || r.url?.includes('demo')
                      const Icon = isGh ? Code2 : isDm ? MonitorPlay : FileText
                      return (
                        <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors bg-muted/20">
                          <div className="shrink-0 p-2 bg-background rounded-md"><Icon className="h-5 w-5 text-primary" /></div>
                          <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{isGh ? t.projectTab.repoUrl : isDm ? t.projectTab.demoUrl : t.judge.presentationLabel}</p><p className="text-xs text-muted-foreground truncate">{r.url}</p></div>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-4">{t.teamTab.members}</h3>
              <ul className="divide-y divide-border">
                {members.map((m: any) => (
                  <li key={m.id} className="py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {(m.user?.fullName || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.user?.fullName || t.teamTab.member}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.user?.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.role === 'captain' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'}`}>
                      {m.role === 'captain' ? t.teamTab.captain : t.teamTab.member}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isAdmin && (
            <div className="space-y-6">
               <h3 className="text-lg font-bold">{t.judge.judgesScores(scoresByJudge.length)}</h3>
               <div className="grid gap-6 sm:grid-cols-1">
                 {scoresByJudge.map((sj, idx) => (
                   <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                      <div className="px-5 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                              {sj.judge?.fullName ? sj.judge.fullName[0] : '?'}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{sj.judge?.fullName || sj.judgeId.slice(0, 8)}</p>
                              <p className="text-[10px] text-muted-foreground">@{sj.judge?.username || 'unknown'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                           <p className="text-xl font-black text-primary">{sj.total.toFixed(2)}</p>
                           <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t.judge.totalScore}</p>
                         </div>
                      </div>
                      <div className="p-5 space-y-6">
                        {/* Vertical Bars Chart */}
                        <div className="flex items-end justify-between gap-2 h-48 pt-6 border-b border-border relative">
                           {/* Score axis markers */}
                           <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-muted-foreground/50 font-bold pr-1 border-r border-border/50">
                             <span>10</span><span>7.5</span><span>5</span><span>2.5</span><span>0</span>
                           </div>

                           {criteria.map(c => {
                             const s = sj.assessments.find((a: any) => a.criteriaId === c.id)
                             const val = Number(s?.assessment || 0)
                             const max = Number(c.maxScore) || 10
                             const height = (val / max) * 100
                             
                             return (
                               <div key={c.id} className="flex-1 flex flex-col items-center gap-2 group relative">
                                 {/* Tooltip on hover */}
                                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold border border-border">
                                   {c.name}: {val}/{max}
                                 </div>

                                 <div className="w-10 bg-muted/50 rounded-t-lg overflow-hidden flex flex-col justify-end h-full border border-border/50 shadow-inner">
                                   <div 
                                     className="w-full bg-gradient-to-t from-primary to-primary/80 transition-all duration-700 hover:brightness-110" 
                                     style={{ height: `${height}%` }}
                                   >
                                     {height > 15 && (
                                       <div className="text-[10px] text-primary-foreground font-bold text-center pt-2">
                                         {val}
                                       </div>
                                     )}
                                   </div>
                                 </div>
                                 
                                 <div className="h-12 flex items-center justify-center">
                                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter text-center leading-tight max-w-[45px] line-clamp-2" title={c.name}>
                                     {c.name}
                                   </span>
                                 </div>
                               </div>
                             )
                           })}
                        </div>

                        {sj.assessments[0]?.comment && (
                          <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{t.judge.judgeComment}</p>
                            <p className="text-sm italic text-muted-foreground">"{sj.assessments[0].comment}"</p>
                          </div>
                        )}
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        {!isAdmin && (
          <div className="lg:w-2/5">
            <div className="sticky top-6 space-y-4">
              {hasExisting && !done && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 text-blue-800 p-4 text-sm">
                  <p className="font-semibold">{t.judge.alreadyScored}</p>
                  {existing[0]?.updatedAt && <p className="text-xs mt-0.5 opacity-80">{t.judge.alreadyScoredDesc(formatRelativeTime(existing[0].updatedAt))}</p>}
                </div>
              )}

              {draftBanner !== null && !hasExisting && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 p-4 text-sm">
                  <p className="font-semibold">{t.judge.draftFound}</p>
                  {draftBanner && <p className="text-xs mt-0.5 opacity-80">{t.judge.draftSavedAgo(formatRelativeTime(draftBanner))}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { const r = localStorage.getItem(draftKey); if (r) { const p = JSON.parse(r); if (p.assessments) setAssessments(p.assessments); if (p.comment) setComment(p.comment) }; setDraftBanner(null) }} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700">
                      <RotateCcw className="h-3.5 w-3.5" /> {t.judge.restore}
                    </button>
                    <button onClick={() => { localStorage.removeItem(draftKey); setDraftBanner(null) }} className="text-xs px-3 py-1.5 rounded-md border border-amber-300 text-amber-700 hover:bg-amber-100">
                      {t.judge.ignore}
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
                  <Save className="h-5 w-5 text-primary" /><h3 className="font-bold text-lg">{t.judge.myAssessment}</h3>
                </div>

                <div className="p-6 space-y-6 max-h-[52vh] overflow-y-auto">
                  {criteria.map((c: any) => {
                    const max = Number(c.maxScore) || 10
                    const val = assessments[c.id] ?? 0
                    return (
                      <div key={c.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div><h4 className="text-sm font-semibold">{c.name}</h4>{c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}</div>
                          <span className="shrink-0 text-xs bg-accent px-2 py-0.5 rounded font-medium">{t.judge.weightLabel(Math.round(Number(c.weight) * 100))}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range" min={0} max={max} step={1} value={val}
                            onChange={e => !isFinished && handleSlider(c.id, Number(e.target.value))}
                            disabled={isFinished}
                            className={`flex-1 accent-primary ${isFinished ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          />
                          <span className="w-14 text-right font-mono font-bold text-primary text-sm">{val}<span className="text-xs text-muted-foreground font-normal">/{max}</span></span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${(val / max) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}

                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold">{t.judge.commentOptional}</label>
                      <span className={`text-xs ${comment.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>{comment.length}/500</span>
                    </div>
                    <textarea value={comment} onChange={e => handleComment(e.target.value.slice(0, 500))} placeholder={t.judge.commentPlaceholder} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none" />
                  </div>
                </div>

                {/* Score preview */}
                {criteria.length > 0 && (
                  <div className="px-6 py-4 border-t border-border bg-muted/10 space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.judge.summaryScore}</p>
                    {criteria.map((c: any) => {
                      const val = assessments[c.id] ?? 0
                      const w = Number(c.weight)
                      return (
                        <div key={c.id} className="flex justify-between text-xs text-muted-foreground">
                          <span className="truncate mr-2">{c.name}</span>
                          <span className="font-mono shrink-0">{val} × {Math.round(w * 100)}% = <span className="font-bold text-foreground">{(val * w).toFixed(2)}</span></span>
                        </div>
                      )
                    })}
                    <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
                      <span>{t.judge.totalLabel}</span>
                      <span className="text-lg text-primary">{total.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/10</span></span>
                    </div>
                  </div>
                )}

                <div className="px-6 pb-6 pt-4 space-y-3">
                  {isFinished ? (
                    <div className="w-full rounded-md bg-muted border border-border px-4 py-3 text-sm font-medium text-muted-foreground text-center flex items-center justify-center gap-2">
                      <Lock className="h-4 w-4" /> {t.judge.judgingClosed}
                    </div>
                  ) : (
                    <button onClick={() => submitMut.mutate()} disabled={submitMut.isPending || criteria.length === 0 || done} className="w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      {submitMut.isPending ? t.states.loading : hasExisting ? t.judge.updateScore : t.judge.submitScore}
                    </button>
                  )}
                  <p className="text-center text-xs text-muted-foreground">
                    <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">Enter</kbd>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
