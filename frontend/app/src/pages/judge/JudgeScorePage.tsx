import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ExternalLink, MonitorPlay, FileText } from 'lucide-react'
import { judgingApi } from '@/api/judging'
import { projectsApi } from '@/api/projects'
import { teamsApi } from '@/api/teams'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/utils/format'
import { useAuthStore } from '@/store/auth.store'

export function JudgeScorePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // 1. Fetch Project Details
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId!).then(res => res.data.data),
    enabled: !!projectId
  })

  // 2. Fetch Team & Track Info (to get the trackId for criteria)
  const { data: teamData } = useQuery({
    queryKey: ['team', projectData?.teamId],
    queryFn: () => teamsApi.list({ limit: 1 }).then(res => res.data.data.find((t: any) => t.id === projectData?.teamId)),
    enabled: !!projectData?.teamId
  })

  // 3. Fetch Criteria for this track
  const trackId = teamData?.trackId
  const { data: criteriaData, isLoading: criteriaLoading } = useQuery({
    queryKey: ['criteria', trackId],
    queryFn: () => judgingApi.getCriteriaByTrack(trackId!).then(res => res.data.data),
    enabled: !!trackId
  })

  // 4. Fetch My Existing Scores
  const { data: myScoresData } = useQuery({
    queryKey: ['my-scores'],
    queryFn: () => judgingApi.getMyScores().then(res => res.data.data)
  })

  const criteriaList = criteriaData || []
  const myScores = myScoresData || []
  
  // Find if already scored
  const existingScores = myScores.filter((s: any) => s.projectId === projectId)
  const hasExistingScores = existingScores.length > 0

  // Local state for sliders and comments
  const [assessments, setAssessments] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')

  // Draft auto-save logic
  const draftKey = `draft_score_${projectId}_${user?.id}`
  
  useEffect(() => {
    // If we have existing scores from backend, prefer those
    if (hasExistingScores) {
      const initial: Record<string, number> = {}
      existingScores.forEach((s: any) => {
        initial[s.criteriaId] = Number(s.assessment)
      })
      setAssessments(initial)
      // Take comment from the first score (backend schema currently stores comment per score)
      setComment(existingScores[0]?.comment || '')
    } else {
      // Otherwise try loading from draft
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          if (parsed.assessments) setAssessments(parsed.assessments)
          if (parsed.comment) setComment(parsed.comment)
        } catch(e) {}
      }
    }
  }, [hasExistingScores, existingScores, draftKey])

  // Save draft on change (only if not already scored successfully in DB, to avoid overwriting clean state unnecessarily, though it's fine)
  useEffect(() => {
    if (Object.keys(assessments).length > 0 && !hasExistingScores) {
      localStorage.setItem(draftKey, JSON.stringify({ assessments, comment }))
    }
  }, [assessments, comment, draftKey, hasExistingScores])

  // Mutation for submitting score
  const submitMut = useMutation({
    mutationFn: async () => {
      // Submit a score for each criteria
      for (const criteria of criteriaList) {
        const val = assessments[criteria.id] || 0
        await judgingApi.submitScore({
          projectId: projectId!,
          criteriaId: criteria.id,
          assessment: val,
          comment
        })
      }
    },
    onSuccess: () => {
      localStorage.removeItem(draftKey)
      queryClient.invalidateQueries({ queryKey: ['my-scores'] })
      alert('Оцінку успішно збережено!')
      navigate('/app/judge/projects')
    },
    onError: (err: any) => alert(err.message || 'Помилка збереження')
  })

  const handleSliderChange = (criteriaId: string, val: number) => {
    setAssessments(prev => ({ ...prev, [criteriaId]: val }))
  }

  // Keyboard shortcut Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!submitMut.isPending) submitMut.mutate()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [submitMut])

  if (projectLoading || criteriaLoading || !teamData) {
    return <div className="py-24"><LoadingSpinner /></div>
  }

  const project = projectData!

  // Calculate live preview
  let totalPreview = 0
  criteriaList.forEach((c: any) => {
    const val = assessments[c.id] || 0
    const w = Number(c.weight)
    const max = Number(c.maxScore)
    if (max > 0) totalPreview += val * (w / max)
  })

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-6">
      <Link to="/app/judge/projects" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2">
        <ChevronLeft className="mr-1 h-4 w-4" /> Назад до списку
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Project Details */}
        <div className="lg:w-3/5 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground bg-accent px-2 py-1 rounded-md">{teamData.name}</span>
              {teamData.track?.name && <span>Трек: {teamData.track.name}</span>}
              <span>•</span>
              <span>Подано: {project.submittedAt ? formatDate(project.submittedAt) : 'Чернетка'}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm prose prose-sm max-w-none dark:prose-invert">
            <h3 className="text-lg font-semibold mb-4 mt-0">Опис проєкту</h3>
            <p className="whitespace-pre-wrap">{(project as any).description || 'Опис відсутній.'}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Ресурси</h3>
            {(!project.resources || project.resources.length === 0) ? (
              <p className="text-sm text-muted-foreground">Команда не додала жодних ресурсів.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {project.resources.map((res: any) => {
                  const isGithub = res.url.includes('github.com')
                  const isDemo = res.url.includes('vercel') || res.url.includes('netlify') || res.url.includes('demo')
                  return (
                    <a 
                      key={res.id} 
                      href={res.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors bg-muted/20 hover:bg-muted/40"
                    >
                      <div className="shrink-0 p-2 bg-background rounded-md shadow-sm">
                        {isGithub ? <div className="h-5 w-5 bg-muted rounded-full" /> : isDemo ? <MonitorPlay className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{res.description || (isGithub ? 'Репозиторій' : 'Посилання')}</p>
                        <p className="text-xs text-muted-foreground truncate">{res.url}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scoring Form (Sticky) */}
        <div className="lg:w-2/5">
          <div className="sticky top-6 space-y-6">
            
            {hasExistingScores && (
              <div className="rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 p-4 text-sm font-medium">
                Ви вже оцінили цей проєкт. Можете змінити свою оцінку нижче.
              </div>
            )}

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border bg-muted/20">
                <h3 className="text-xl font-bold">Виставити оцінку</h3>
              </div>
              
              <div className="p-6 space-y-8 flex-1 overflow-y-auto max-h-[60vh]">
                {criteriaList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Критерії для цього треку ще не налаштовані.</p>
                ) : (
                  criteriaList.map((c: any) => {
                    const max = Number(c.maxScore)
                    const weight = Number(c.weight)
                    const val = assessments[c.id] || 0

                    return (
                      <div key={c.id} className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{c.name}</h4>
                            {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                          </div>
                          <span className="shrink-0 bg-accent px-2 py-0.5 rounded text-xs font-medium" title="Вага критерію">
                            Вага: {weight}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <input 
                            type="range" 
                            min="0" 
                            max={max} 
                            step="1" 
                            value={val}
                            onChange={(e) => handleSliderChange(c.id, Number(e.target.value))}
                            className="flex-1 accent-primary"
                          />
                          <div className="w-12 text-right font-mono font-bold text-lg text-primary">
                            {val}<span className="text-sm text-muted-foreground font-normal">/{max}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="text-sm font-semibold">Коментар (необов'язково)</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ваш фідбек для команди..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-border bg-muted/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Попередній підсумок:</span>
                  <span className="text-2xl font-black">{totalPreview.toFixed(2)} <span className="text-lg text-muted-foreground font-medium">/ 100</span></span>
                </div>
                
                <button 
                  onClick={() => submitMut.mutate()}
                  disabled={submitMut.isPending || criteriaList.length === 0}
                  className="w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {submitMut.isPending ? 'Збереження...' : hasExistingScores ? 'Оновити оцінку' : 'Зберегти оцінку'}
                </button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Можна також натиснути <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Enter</kbd>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
