import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileCheck, Activity, Target, Clock, Edit } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { judgingApi } from '@/api/judging'
import { formatDate } from '@/utils/format'

export function JudgeScoresOverviewPage() {
  const { data: myScoresData, isLoading } = useQuery({
    queryKey: ['my-scores'],
    queryFn: () => judgingApi.getMyScores().then(res => res.data.data)
  })

  // To display the project name and track, we need to fetch the projects details
  // Wait, the scores from backend `scores` table don't have project names joined.
  // We'll group them by projectId.

  const scores = myScoresData || []
  
  if (isLoading) return <div className="py-24"><LoadingSpinner /></div>

  // Group scores by projectId
  const projectsEvaluated = new Map<string, any>()
  let totalAssessmentSum = 0

  scores.forEach((s: any) => {
    if (!projectsEvaluated.has(s.projectId)) {
      projectsEvaluated.set(s.projectId, {
        projectId: s.projectId,
        updatedAt: s.updatedAt,
        criteriaScores: []
      })
    }
    const p = projectsEvaluated.get(s.projectId)
    p.criteriaScores.push(s)
    totalAssessmentSum += Number(s.assessment)
  })

  const evaluatedList = Array.from(projectsEvaluated.values())
  const totalEvaluated = evaluatedList.length
  const avgScore = scores.length > 0 ? totalAssessmentSum / scores.length : 0 // Rough simple average across all individual criteria assessments

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Мої оцінки" subtitle="Перегляд та редагування виставлених вами оцінок" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <FileCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Оцінено проєктів</span>
          </div>
          <span className="text-3xl font-bold">{totalEvaluated}</span>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Середній бал (сирий)</span>
          </div>
          <span className="text-3xl font-bold">{avgScore.toFixed(1)}</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Target className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium">Всього критеріїв оцінено</span>
          </div>
          <span className="text-3xl font-bold">{scores.length}</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm bg-gradient-to-br from-card to-accent/50">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Clock className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Залишилось</span>
          </div>
          <Link to="/app/judge/projects" className="text-sm font-bold text-primary hover:underline mt-1 block">
            Перейти до проєктів →
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Історія оцінювання</h3>
        
        {evaluatedList.length === 0 ? (
          <EmptyState title="Ви ще не оцінили жодного проєкту" description="Перейдіть у вкладку 'Проєкти', щоб розпочати оцінювання" />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Проєкт (ID)</th>
                    <th className="px-6 py-4 font-semibold">Оцінки за критеріями</th>
                    <th className="px-6 py-4 font-semibold">Останнє оновлення</th>
                    <th className="px-6 py-4 font-semibold text-right">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {evaluatedList.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(p => (
                    <tr key={p.projectId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-muted-foreground bg-accent px-2 py-1 rounded inline-block">
                          {p.projectId.split('-')[0]}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {p.criteriaScores.map((s: any) => (
                            <span key={s.id} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold" title={s.criteriaId}>
                              {s.assessment}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {formatDate(p.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link 
                          to={`/app/judge/score/${p.projectId}`}
                          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Редагувати оцінку"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
