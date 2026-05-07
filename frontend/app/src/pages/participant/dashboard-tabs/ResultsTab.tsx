import { useQuery } from '@tanstack/react-query'
import { Lock, Medal, Award } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { judgingApi } from '@/api/judging'
import { projectsApi } from '@/api/projects'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Hackathon, Team } from '@/types/api.types'

interface ResultsTabProps {
  hackathon: Hackathon
  myTeam?: Team
  stageInfo: ReturnType<typeof import('@/hooks/useHackathonStage').useHackathonStage>
}

export function ResultsTab({ hackathon, myTeam, stageInfo }: ResultsTabProps) {
  const { data: projData } = useQuery({
    queryKey: ['team-project', myTeam?.id],
    queryFn: () => projectsApi.list({ teamId: myTeam?.id }).then(res => res.data.data[0]),
    enabled: !!myTeam?.id && stageInfo.canViewResults,
  })

  const { data: leaderboardData, isLoading: lbLoading } = useQuery({
    queryKey: ['leaderboard', hackathon.id],
    queryFn: () => judgingApi.getLeaderboard(hackathon.id).then(res => res.data.data),
    enabled: stageInfo.canViewResults,
  })

  const { data: scoresData, isLoading: scoresLoading } = useQuery({
    queryKey: ['team-scores', projData?.id],
    queryFn: () => judgingApi.getTeamScores(projData!.id).then(res => res.data.data),
    enabled: !!projData?.id && stageInfo.canViewResults,
  })

  if (!stageInfo.canViewResults) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center">
        <Lock className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Результати недоступні</h3>
        <p className="text-muted-foreground max-w-md">
          Результати будуть опубліковані після завершення етапу суддівства.
        </p>
      </div>
    )
  }

  const leaderboard = leaderboardData || []
  const scores = scoresData || []

  const isLoading = lbLoading || scoresLoading

  if (isLoading) return <div className="py-24"><LoadingSpinner /></div>

  const myRankIndex = leaderboard.findIndex(entry => entry.projectId === projData?.id)
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null

  return (
    <div className="mt-6 space-y-8 animate-fade-in">
      
      {/* My Results Summary */}
      {projData && (
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Ваша позиція</h3>
            {myRank ? (
              <div className="flex items-center gap-3">
                {myRank === 1 && <Medal className="h-12 w-12 text-yellow-500" />}
                {myRank === 2 && <Medal className="h-10 w-10 text-gray-400" />}
                {myRank === 3 && <Medal className="h-10 w-10 text-amber-600" />}
                {myRank > 3 && <Award className="h-10 w-10 text-primary" />}
                <span className="text-6xl font-black">{myRank}</span>
                <span className="text-2xl text-muted-foreground self-end mb-2">/ {leaderboard.length}</span>
              </div>
            ) : (
              <p className="text-xl font-bold">Проєкт не оцінено</p>
            )}
          </div>

          {scores.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Деталізація оцінок</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scores.map((s: any) => ({
                    name: s.criteria?.name || 'Критерій',
                    score: s.normalizedScore || s.score
                  }))} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="score" name="Оцінка" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Leaderboard Table */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Лідерборд</h3>
        {leaderboard.length === 0 ? (
          <EmptyState title="Лідерборд порожній" description="Оцінки ще не виставлені" />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-16 text-center">Місце</th>
                    <th className="px-6 py-4 font-semibold">Проєкт / Команда</th>
                    <th className="px-6 py-4 font-semibold">Трек</th>
                    <th className="px-6 py-4 font-semibold text-right">Бали</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaderboard.map((entry: any, index) => {
                    const isMyTeam = entry.projectId === projData?.id
                    return (
                      <tr key={entry.id} className={`${isMyTeam ? 'bg-primary/5' : 'hover:bg-muted/30'} transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {index === 0 && <Medal className="h-5 w-5 text-yellow-500 mx-auto" />}
                          {index === 1 && <Medal className="h-5 w-5 text-gray-400 mx-auto" />}
                          {index === 2 && <Medal className="h-5 w-5 text-amber-600 mx-auto" />}
                          {index > 2 && <span className="font-semibold text-muted-foreground">{index + 1}</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {entry.projectTitle || entry.project?.title || 'Без назви'}
                            {isMyTeam && <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-primary text-primary-foreground rounded">Ваша команда</span>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {entry.teamName || entry.team?.name || 'Команда'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {entry.trackName || entry.team?.track?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-foreground">
                          {Number(entry.totalScore).toFixed(1)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
