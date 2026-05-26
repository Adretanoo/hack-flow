import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileCheck, TrendingUp, TrendingDown, Activity, Edit } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { judgingApi } from '@/api/judging'
import { formatDate, formatRelativeTime } from '@/utils/format'
import { useI18n } from '@/i18n'

export function JudgeScoresOverviewPage() {
  const { t } = useI18n()
  const { data: myScoresData, isLoading } = useQuery({
    queryKey: ['my-scores'],
    queryFn: () => judgingApi.getMyScores().then(res => res.data.data),
  })

  const scores: any[] = myScoresData || []
  if (isLoading) return <div className="py-24"><LoadingSpinner /></div>

  // Group by projectId
  const byProject = new Map<string, any[]>()
  scores.forEach((s: any) => {
    if (!byProject.has(s.projectId)) byProject.set(s.projectId, [])
    byProject.get(s.projectId)!.push(s)
  })
  const projects = Array.from(byProject.entries()).map(([projectId, ss]) => ({
    projectId,
    scores: ss,
    updatedAt: ss.reduce((latest: string, s: any) => (s.updatedAt > latest ? s.updatedAt : latest), ss[0].updatedAt),
    avg: ss.reduce((sum: number, s: any) => sum + Number(s.assessment), 0) / ss.length,
  })).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const totalEvaluated = projects.length
  const allAssessments = scores.map((s: any) => Number(s.assessment))
  const avgScore = allAssessments.length > 0 ? allAssessments.reduce((a, b) => a + b, 0) / allAssessments.length : 0
  const highestScore = allAssessments.length > 0 ? Math.max(...allAssessments) : 0
  const lowestScore  = allAssessments.length > 0 ? Math.min(...allAssessments) : 0

  const stats = [
    { label: t.judge.scoredProjects, value: totalEvaluated, Icon: FileCheck, color: 'text-primary' },
    { label: t.judge.avgAssessment, value: avgScore.toFixed(1), Icon: Activity, color: 'text-blue-500' },
    { label: t.judge.highestScore, value: highestScore, Icon: TrendingUp, color: 'text-green-500' },
    { label: t.judge.lowestScore, value: lowestScore, Icon: TrendingDown, color: 'text-amber-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t.judge.scores} subtitle={t.judge.scoresSubtitle} />

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Scored projects table */}
      <div>
        <h3 className="text-xl font-semibold mb-4">{t.judge.judgingHistory}</h3>
        {projects.length === 0 ? (
          <EmptyState
            title={t.judge.noScores}
            description={t.judge.noScoresDesc}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t.resultsTab.project}</th>
                    <th className="px-6 py-4 font-semibold">{t.judge.scores}</th>
                    <th className="px-6 py-4 font-semibold">{t.judge.avgScore}</th>
                    <th className="px-6 py-4 font-semibold">{t.judge.updatedAt}</th>
                    <th className="px-6 py-4 font-semibold text-right">{t.judge.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.map(p => (
                    <tr key={p.projectId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-accent px-2 py-1 rounded">
                          {p.projectId.split('-')[0]}…
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {p.scores.map((s: any) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                              title={s.criteria?.name || s.criteriaId}
                            >
                              {s.criteria?.name ? `${s.criteria.name.slice(0, 8)}: ` : ''}{s.assessment}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-base text-primary">{p.avg.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">/10</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        <span title={formatDate(p.updatedAt)}>{formatRelativeTime(p.updatedAt)} {t.judge.ago}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/app/judge/score/${p.projectId}`}
                          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title={t.judge.editScore}
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
