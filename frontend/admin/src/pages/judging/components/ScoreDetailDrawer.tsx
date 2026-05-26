import { useQuery } from '@tanstack/react-query'
import { judgingApi } from '@/api/judging'
import { X, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useI18n } from '@/i18n'
import type { Score, Conflict } from '@/types/api.types'

interface ScoreDetailDrawerProps {
  projectId: string | null
  hackathonId: string
  onClose: () => void
}

export function ScoreDetailDrawer({ projectId, hackathonId, onClose }: ScoreDetailDrawerProps) {
  const { lang } = useI18n()
  
  const { data: scoresData, isLoading: scoresLoading } = useQuery({
    queryKey: ['scores', projectId],
    queryFn: () => judgingApi.getProjectScores(projectId!),
    enabled: !!projectId,
  })

  const { data: conflictsData } = useQuery({
    queryKey: ['conflicts', hackathonId],
    queryFn: () => judgingApi.listAllConflicts({ hackathonId, limit: 1000 }),
    enabled: !!hackathonId && !!projectId,
  })

  if (!projectId) return null

  const scores = (scoresData?.data?.data ?? []) as Score[]
  const conflicts = (conflictsData?.data as any)?.data as Conflict[] ?? []

  // Group scores by judge
  const judgeGroups = scores.reduce((acc, score) => {
    if (!acc[score.judgeId]) acc[score.judgeId] = []
    acc[score.judgeId].push(score)
    return acc
  }, {} as Record<string, Score[]>)

  const chartData = Object.entries(judgeGroups).map(([judgeId, judgeScores]) => {
    const judge = judgeScores[0]?.judge
    const name = judge?.fullName || (lang === 'uk' ? `Суддя ${judgeId.slice(0, 4)}` : `Judge ${judgeId.slice(0, 4)}`)
    const total = judgeScores.reduce((sum, s) => sum + Number(s.assessment), 0)
    return { name, total, fullName: judge?.fullName, username: judge?.username }
  })

  const isConflicted = conflicts.some(c => c.teamId === projectId)

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-border bg-background shadow-2xl flex flex-col animate-slide-left">
      <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
        <div>
          <h3 className="text-lg font-bold">
            {lang === 'uk' ? 'Аналітика оцінювання' : 'Evaluation Analytics'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {lang === 'uk' ? 'Детальний розподіл балів від суддів' : 'Detailed score distribution from judges'}
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        {isConflicted && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 p-4 text-red-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold">{lang === 'uk' ? 'Конфлікт інтересів!' : 'Conflict of interest!'}</p>
              <p className="opacity-80">
                {lang === 'uk' ? "Цей проєкт має зв'язок з одним із суддів." : 'This project has a connection with one of the judges.'}
              </p>
            </div>
          </div>
        )}

        {scoresLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">
              {lang === 'uk' ? 'Завантаження балів...' : 'Loading scores...'}
            </p>
          </div>
        ) : scores.length === 0 ? (
          <EmptyState 
            title={lang === 'uk' ? 'Оцінок немає' : 'No scores'} 
            description={lang === 'uk' ? 'Судді ще не оцінили цей проєкт.' : 'Judges have not scored this project yet.'} 
          />
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                  {lang === 'uk' ? 'Порівняння суддів' : 'Judge Comparison'}
                </h4>
                <div className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">Total Scores</div>
              </div>
              <div className="h-64 w-full rounded-2xl border border-border bg-card p-4 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                    <XAxis 
                      dataKey="name" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border p-3 rounded-xl shadow-xl">
                              <p className="font-bold text-sm">{data.fullName || data.name}</p>
                              {data.username && <p className="text-[10px] text-muted-foreground">@{data.username}</p>}
                              <p className="text-primary font-mono font-bold mt-1">
                                {data.total} {lang === 'uk' ? 'балів' : 'points'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                      {chartData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill="hsl(var(--primary))" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground px-1">
                {lang === 'uk' ? 'Деталізація по суддях' : 'Detailed breakdown by judges'}
              </h4>
              <div className="grid gap-4">
                {Object.entries(judgeGroups).map(([judgeId, judgeScores]) => {
                  const judge = judgeScores[0]?.judge;
                  return (
                    <div key={judgeId} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-muted/30 px-4 py-3 flex items-center gap-3 border-b border-border">
                         <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                           {judge?.fullName ? judge.fullName[0] : '?'}
                         </div>
                         <div>
                           <p className="text-sm font-bold leading-none">
                             {judge?.fullName || (lang === 'uk' ? `Суддя ${judgeId.slice(0, 8)}` : `Judge ${judgeId.slice(0, 8)}`)}
                           </p>
                           {judge?.username && <p className="text-[10px] text-muted-foreground mt-1">@{judge.username}</p>}
                         </div>
                      </div>
                      <div className="p-4 space-y-2">
                        {judgeScores.map(s => (
                          <div key={s.id} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-primary/40" />
                              {s.criteria?.name || (lang === 'uk' ? `Критерій ${s.criteriaId.slice(0,4)}` : `Criterion ${s.criteriaId.slice(0,4)}`)}
                            </span>
                            <span className="font-mono font-bold">{s.assessment}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center font-bold text-primary pt-3 mt-3 border-t border-border">
                          <span>{lang === 'uk' ? 'Всього за проєкт:' : 'Project total:'}</span>
                          <span className="text-lg">{judgeScores.reduce((sum, s) => sum + Number(s.assessment), 0)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
