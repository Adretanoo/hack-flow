import { useQuery } from '@tanstack/react-query'
import { judgingApi } from '@/api/judging'
import { X, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Score, Conflict } from '@/types/api.types'

interface ScoreDetailDrawerProps {
  projectId: string | null
  hackathonId: string
  onClose: () => void
}

export function ScoreDetailDrawer({ projectId, hackathonId, onClose }: ScoreDetailDrawerProps) {
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
    const total = judgeScores.reduce((sum, s) => sum + s.assessment, 0)
    return { name: `Суддя ${judgeId.slice(0,4)}`, total }
  })

  const isConflicted = conflicts.some(c => c.teamId === projectId) // Note: teamId and projectId relation might differ in actual schema

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-border bg-background shadow-2xl flex flex-col animate-slide-left">
      <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
        <h3 className="text-lg font-bold">Деталі оцінювання</h3>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {isConflicted && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-medium">Зафіксовано конфлікт інтересів!</p>
          </div>
        )}

        {scoresLoading ? (
          <LoadingSpinner className="py-10" />
        ) : scores.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 italic">Проєкт ще не оцінено.</p>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
              <h4 className="font-semibold text-sm">Розподіл балів</h4>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill="hsl(var(--primary))" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm px-1">Оцінки за критеріями</h4>
              {Object.entries(judgeGroups).map(([judgeId, judgeScores]) => (
                <div key={judgeId} className="rounded-lg border border-border bg-muted/10 p-3 text-sm">
                  <div className="font-medium mb-2 border-b border-border pb-2">Суддя {judgeId.slice(0, 8)}...</div>
                  <div className="space-y-1">
                    {judgeScores.map(s => (
                      <div key={s.id} className="flex justify-between text-muted-foreground">
                        <span className="truncate pr-2">Критерій {s.criteriaId.slice(0,4)}</span>
                        <span className="font-medium text-foreground">{s.assessment} балів</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-foreground pt-2 mt-2 border-t border-border">
                      <span>Разом:</span>
                      <span>{judgeScores.reduce((sum, s) => sum + s.assessment, 0)} балів</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
