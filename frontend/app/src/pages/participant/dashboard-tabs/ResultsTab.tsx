import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Lock, ChevronDown, ChevronRight, AlertCircle, XCircle, Clock } from 'lucide-react'
import { judgingApi } from '@/api/judging'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Hackathon, Team } from '@/types/api.types'

interface ResultsTabProps {
  hackathon: Hackathon
  myTeam?: Team
  stageInfo: ReturnType<typeof import('@/hooks/useHackathonStage').useHackathonStage>
}

const MEDALS: Record<number, { icon: string; bg: string; text: string }> = {
  1: { icon: '🥇', bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
  2: { icon: '🥈', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
  3: { icon: '🥉', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
}

function ScoreBar({ value, max, color = 'bg-primary' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">{value}/{max}</span>
    </div>
  )
}

function PositionBadge({ pos }: { pos: number }) {
  const m = MEDALS[pos]
  if (m) return <span className="text-2xl">{m.icon}</span>
  return <span className="text-lg font-bold text-muted-foreground">{pos}</span>
}

function StageProgressBar({ currentType }: { currentType: string }) {
  const ORDER = ['REGISTRATION', 'HACKING', 'JUDGING', 'FINISHED']
  const currentIdx = ORDER.indexOf(currentType)
  return (
    <div className="flex items-center gap-0 w-full max-w-lg mx-auto">
      {ORDER.map((s, i) => {
        const labels: Record<string, string> = { REGISTRATION: 'Реєстрація', HACKING: 'Хакінг', JUDGING: 'Суддівство', FINISHED: 'Завершення' }
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                ${done ? 'bg-primary border-primary text-primary-foreground' : active ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border text-muted-foreground'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>{labels[s]}</span>
            </div>
            {i < ORDER.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 ${done ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ExpandableTeamRow({ entry, isMe, pos }: { entry: any; isMe: boolean; pos: number }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${isMe ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'} border-b border-border`}
        onClick={() => setOpen(o => !o)}
      >
        <td className="px-4 py-3 w-12 text-center">
          <PositionBadge pos={pos} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{entry.teamName}</span>
            {isMe && <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-primary text-primary-foreground rounded">Ваша команда</span>}
            {entry.award && <span className="px-2 py-0.5 text-[10px] font-semibold bg-yellow-100 text-yellow-800 rounded-full">🏅 {entry.award.name}</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{entry.members?.length ?? 0} учасників · {entry.trackName}</div>
        </td>
        <td className="px-4 py-3 max-w-[200px]">
          <div className="font-medium text-sm truncate">{entry.project?.title ?? '—'}</div>
          {entry.project?.isLate && <span className="text-[10px] text-orange-600 font-medium">⚠️ Запізнення</span>}
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-xl font-black text-foreground">{entry.normalizedTotal.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </td>
        <td className="px-4 py-3 text-center text-muted-foreground">
          {open ? <ChevronDown className="h-4 w-4 mx-auto" /> : <ChevronRight className="h-4 w-4 mx-auto" />}
        </td>
      </tr>
      {open && (
        <tr className={`${isMe ? 'bg-primary/5' : 'bg-muted/20'} border-b border-border`}>
          <td colSpan={5} className="px-6 py-5">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Members */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Учасники</h4>
                <div className="space-y-1">
                  {(entry.members ?? []).map((m: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">{m.fullName[0]}</span>
                      <span>{m.fullName}</span>
                      {m.role === 'captain' && <span className="text-[10px] text-muted-foreground">(капітан)</span>}
                    </div>
                  ))}
                </div>
              </div>
              {/* Score bars */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Деталізація оцінок</h4>
                <div className="space-y-2">
                  {(entry.perCriteria ?? []).map((c: any) => (
                    <div key={c.criteriaId}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground">{c.criteriaName}</span>
                        <span className="text-muted-foreground">вага ×{c.weight}</span>
                      </div>
                      <ScoreBar value={c.avgScore} max={c.maxScore} />
                    </div>
                  ))}
                  {(entry.perCriteria ?? []).length === 0 && <p className="text-xs text-muted-foreground">Оцінок ще немає</p>}
                </div>
                {entry.project && (
                  <div className="flex gap-3 mt-3">
                    {entry.project.resources?.filter((r: any) => /github|gitlab|bitbucket/i.test(r.url)).map((r: any, i: number) => (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">🔗 GitHub</a>
                    ))}
                    {entry.project.resources?.filter((r: any) => /demo|vercel|netlify|app\./i.test(r.url)).map((r: any, i: number) => (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">🌐 Демо</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function ResultsTab({ hackathon, myTeam, stageInfo }: ResultsTabProps) {
  const [activeTrackIdx, setActiveTrackIdx] = useState(0)
  const [showUnranked, setShowUnranked] = useState(false)

  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['full-results', hackathon.id],
    queryFn: () => judgingApi.getFullResults(hackathon.id).then(r => r.data.data),
    enabled: stageInfo.canViewResults,
  })

  // ── Not finished yet — show progress ───────────────────────
  if (!stageInfo.canViewResults) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center gap-6">
        <Lock className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <h3 className="text-xl font-semibold mb-1">Результати ще не доступні</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Поточний етап: <span className="font-medium text-foreground">{stageInfo.lockMessage}</span>
          </p>
          <StageProgressBar currentType={stageInfo.activeStageType} />
          <p className="text-xs text-muted-foreground mt-6">Результати з'являться після завершення суддівства.</p>
        </div>
      </div>
    )
  }

  if (isLoading) return <div className="py-24"><LoadingSpinner /></div>

  const results = resultsData ?? { tracks: [], disqualified: [], notSubmitted: [], stats: { totalTeams: 0, approvedTeams: 0, disqualifiedTeams: 0, submittedProjects: 0, lateSubmissions: 0, averageScore: 0 } }
  const tracks: any[] = results.tracks ?? []
  const disqualified: any[] = results.disqualified ?? []
  const notSubmitted: any[] = results.notSubmitted ?? []

  // Find my team in results
  const myEntry = myTeam
    ? [...tracks.flatMap((t: any) => t.ranked), ...disqualified, ...notSubmitted].find((e: any) => e.teamId === myTeam.id)
    : null

  const activeTrack = tracks[activeTrackIdx]
  const unrankedCount = disqualified.length + notSubmitted.length

  return (
    <div className="mt-6 space-y-8 animate-fade-in">

      {/* ── My Result Card ─────────────────────────────────── */}
      {myEntry && (
        <section>
          {myEntry.position != null ? (
            // Ranked
            <div className={`rounded-xl border-2 p-6 ${MEDALS[myEntry.position]?.bg ?? 'bg-card border-border'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">🏆 Ваш результат</p>
                  <h3 className="text-xl font-bold mt-1">{myTeam?.name}</h3>
                  <p className="text-sm text-muted-foreground">{myEntry.trackName}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <PositionBadge pos={myEntry.position} />
                    <span className="text-3xl font-black">{myEntry.position} місце</span>
                  </div>
                  <div className="text-2xl font-bold text-primary mt-1">{myEntry.normalizedTotal.toFixed(1)} <span className="text-base font-normal text-muted-foreground">/ 100</span></div>
                </div>
              </div>

              {/* Score breakdown */}
              {(myEntry.perCriteria ?? []).length > 0 && (
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground">
                        <th className="text-left pb-2">Критерій</th>
                        <th className="text-right pb-2">Оцінка</th>
                        <th className="text-right pb-2">Вага</th>
                        <th className="text-right pb-2">Прогрес</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {myEntry.perCriteria.map((c: any) => (
                        <tr key={c.criteriaId}>
                          <td className="py-2 font-medium">{c.criteriaName}</td>
                          <td className="py-2 text-right tabular-nums">{c.avgScore}/{c.maxScore}</td>
                          <td className="py-2 text-right text-muted-foreground">×{c.weight}</td>
                          <td className="py-2 pl-4 w-32"><ScoreBar value={c.avgScore} max={c.maxScore} color="bg-primary" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground mt-2">Оцінювали: {myEntry.judgeCount} {myEntry.judgeCount === 1 ? 'суддя' : 'судді'}</p>
                </div>
              )}

              {/* Award */}
              {myEntry.award && (
                <div className="mt-3 flex items-center gap-2 text-sm font-medium">
                  🏅 <span>Нагорода: <span className="text-foreground">{myEntry.award.name}</span></span>
                </div>
              )}
            </div>
          ) : myEntry.reason === 'DISQUALIFIED' ? (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
              <p className="font-semibold text-red-700 flex items-center gap-2"><XCircle className="h-5 w-5" /> Команда дискваліфікована</p>
              <p className="text-sm text-red-600 mt-1">Причина: «{myEntry.reason}»</p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6">
              <p className="font-semibold text-muted-foreground flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Проєкт не було подано вчасно</p>
              <p className="text-sm text-muted-foreground mt-1">Ваша команда не потрапила до рейтингу.</p>
            </div>
          )}
        </section>
      )}

      {/* ── Leaderboard ────────────────────────────────────── */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Лідерборд</h3>

        {/* Track tabs */}
        {tracks.length > 1 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {tracks.map((t: any, i: number) => (
              <button
                key={t.trackId}
                onClick={() => setActiveTrackIdx(i)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${activeTrackIdx === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {t.trackName}
              </button>
            ))}
          </div>
        )}

        {tracks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Результати ще не сформовані</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-6 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-sm">{activeTrack?.trackName} — Рейтинг</span>
              <span className="text-xs text-muted-foreground">{activeTrack?.ranked?.length ?? 0} команд</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground bg-muted/20 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3 text-left">Команда</th>
                    <th className="px-4 py-3 text-left">Проєкт</th>
                    <th className="px-4 py-3 text-right">Бали</th>
                    <th className="px-4 py-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTrack?.ranked ?? []).map((entry: any) => (
                    <ExpandableTeamRow
                      key={entry.teamId}
                      entry={entry}
                      isMe={entry.teamId === myTeam?.id}
                      pos={entry.position}
                    />
                  ))}
                  {(activeTrack?.ranked ?? []).length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Оцінених команд немає</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Unranked / disqualified ───────────────────────── */}
      {unrankedCount > 0 && (
        <section>
          <button
            onClick={() => setShowUnranked(o => !o)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showUnranked ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Не потрапили до рейтингу ({unrankedCount} команд{unrankedCount > 1 ? 'и' : 'а'})
          </button>

          {showUnranked && (
            <div className="mt-3 space-y-3">
              {disqualified.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2">⛔ Дискваліфіковані</p>
                  {disqualified.map((t: any) => (
                    <div key={t.teamId} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-2">
                      <p className="font-medium text-red-800">{t.teamName}</p>
                      <p className="text-xs text-red-600 mt-0.5">Причина: «{t.reason}»</p>
                    </div>
                  ))}
                </div>
              )}
              {notSubmitted.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">📭 Не подали проєкт</p>
                  {notSubmitted.map((t: any) => (
                    <div key={t.teamId} className="rounded-lg border border-border bg-muted/30 px-4 py-3 mb-2 flex items-center justify-between">
                      <span className="font-medium text-foreground">{t.teamName}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.reason === 'NO_PROJECT' ? 'Проєкт не подано' : t.reason === 'REJECTED' ? 'Проєкт відхилено' : 'Не подано'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

    </div>
  )
}
