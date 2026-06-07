import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { judgingApi } from '@/api/judging'
import { teamsApi } from '@/api/teams'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { toast } from 'sonner'
import { Trophy, Users, AlertTriangle, FileText, Download, RotateCcw, Medal } from 'lucide-react'
import { useI18n } from '@/i18n'
import { downloadCSV } from '@/utils/export'

interface Props { hackathonId: string }



// ── Stat Card ───────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center">
      <p className={`text-3xl font-black ${color ?? 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-orange-500 font-medium">{sub}</p>}
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

// ── Award Modal ─────────────────────────────────────────────────
function AwardModal({ teamId, teamName, awards, onClose, hackathonId }: { teamId: string; teamName: string; awards: any[]; onClose: () => void; hackathonId: string }) {
  const { t, lang } = useI18n()
  const [selected, setSelected] = useState('')
  const qc = useQueryClient()
  const assignMut = useMutation({
    mutationFn: () => judgingApi.assignAward(teamId, selected),
    onSuccess: () => { 
      toast.success(lang === 'uk' ? 'Нагороду призначено' : 'Award assigned')
      qc.invalidateQueries({ queryKey: ['full-results', hackathonId] })
      onClose() 
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка' : 'Error'),
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-semibold text-lg mb-1">
          {lang === 'uk' ? 'Призначити нагороду' : 'Assign Award'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {lang === 'uk' ? 'Команда: ' : 'Team: '} <span className="font-medium text-foreground">{teamName}</span>
        </p>
        <div className="space-y-2 mb-5">
          {awards.map((a: any) => (
            <label key={a.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selected === a.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}>
              <input type="radio" name="award" value={a.id} checked={selected === a.id} onChange={() => setSelected(a.id)} className="accent-primary" />
              <span>
                {a.place === 1 ? '🥇' : a.place === 2 ? '🥈' : a.place === 3 ? '🥉' : '🏅'}{' '}
                {a.name} — {a.place} {lang === 'uk' ? 'місце' : 'place'}
              </span>
            </label>
          ))}
          {awards.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {lang === 'uk' ? 'Немає доступних нагород. Спочатку створіть нагороди.' : 'No awards available. Create awards first.'}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">
            {t.actions.cancel}
          </button>
          <button onClick={() => assignMut.mutate()} disabled={!selected || assignMut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {assignMut.isPending ? (lang === 'uk' ? 'Призначення...' : 'Assigning...') : (lang === 'uk' ? 'Призначити' : 'Assign')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ResultsPanel({ hackathonId }: Props) {
  const { lang } = useI18n()
  const qc = useQueryClient()
  const [activeTrackIdx, setActiveTrackIdx] = useState(0)
  const [awardModal, setAwardModal] = useState<{ teamId: string; teamName: string } | null>(null)

  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['full-results', hackathonId],
    queryFn: () => judgingApi.getFullResults(hackathonId).then(r => r.data.data),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  })
  const { data: awardsData } = useQuery({
    queryKey: ['awards', hackathonId],
    queryFn: () => judgingApi.listAwards(hackathonId).then(r => {
      const raw = r.data?.data ?? r.data
      return Array.isArray(raw) ? raw : []
    }),
  })

  const reinstateTeamMut = useMutation({
    mutationFn: (teamId: string) => teamsApi.updateApproval(teamId, { status: 'APPROVED' }),
    onSuccess: () => { 
      toast.success(lang === 'uk' ? 'Команду поновлено' : 'Team reinstated')
      qc.invalidateQueries({ queryKey: ['full-results', hackathonId] }) 
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка' : 'Error'),
  })

  const removeAwardMut = useMutation({
    mutationFn: ({ teamId, awardId }: { teamId: string; awardId: string }) => judgingApi.removeAward(teamId, awardId),
    onSuccess: () => { 
      toast.success(lang === 'uk' ? 'Нагороду скасовано' : 'Award cancelled')
      qc.invalidateQueries({ queryKey: ['full-results', hackathonId] }) 
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка' : 'Error'),
  })

  if (isLoading) return <div className="py-20"><LoadingSpinner /></div>

  const results = resultsData ?? { tracks: [], disqualified: [], notSubmitted: [], stats: {}, hackathonAwards: [] }
  const tracks: any[] = results.tracks ?? []
  const disqualified: any[] = results.disqualified ?? []
  const notSubmitted: any[] = results.notSubmitted ?? []
  const stats = results.stats ?? {}
  const awards: any[] = Array.isArray(awardsData) ? awardsData : []
  const activeTrack = tracks[activeTrackIdx]

  // ── Export functions ────────────────────────────────────────
  function exportResults() {
    const headers = lang === 'uk'
      ? ['Місце', 'Команда', 'Трек', 'Проєкт', 'Норм. бал', 'Суддів', 'Нагорода', 'Запізнення', 'Подано']
      : ['Place', 'Team', 'Track', 'Project', 'Norm. Score', 'Judges', 'Award', 'Late', 'Submitted']
    const rows = tracks.flatMap((t: any) =>
      t.ranked.map((e: any) => [
        e.position,
        e.teamName,
        t.trackName,
        e.project?.title ?? '—',
        e.normalizedTotal,
        e.judgeCount,
        e.award?.name ?? '—',
        e.project?.isLate ? (lang === 'uk' ? 'Так' : 'Yes') : (lang === 'uk' ? 'Ні' : 'No'),
        e.project?.submittedAt ?? '—',
      ])
    )
    downloadCSV('results.csv', headers, rows)
  }

  function exportScores() {
    const headers = lang === 'uk'
      ? ['Команда', 'Проєкт', 'Трек', 'Суддя', 'Критерій', 'Оцінка', 'Макс.', 'Вага']
      : ['Team', 'Project', 'Track', 'Judge', 'Criterion', 'Score', 'Max', 'Weight']
    const rows = tracks.flatMap((t: any) =>
      t.ranked.flatMap((e: any) =>
        (e.perJudge ?? []).flatMap((j: any) =>
          (e.perCriteria ?? []).map((c: any) => [
            e.teamName,
            e.project?.title ?? '—',
            t.trackName,
            j.judgeName,
            c.criteriaName,
            c.avgScore,
            c.maxScore,
            c.weight,
          ])
        )
      )
    )
    downloadCSV('scores.csv', headers, rows)
  }

  function exportFull() { exportResults(); setTimeout(exportScores, 300) }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label={lang === 'uk' ? 'Команд' : 'Teams'} value={stats.totalTeams ?? 0} />
        <StatCard label={lang === 'uk' ? 'Схвалено' : 'Approved'} value={stats.approvedTeams ?? 0} color="text-green-600" />
        <StatCard label={lang === 'uk' ? 'Дискваліф.' : 'Disqualified'} value={stats.disqualifiedTeams ?? 0} color="text-red-600" />
        <StatCard label={lang === 'uk' ? 'Подано проєктів' : 'Submitted projects'} value={stats.submittedProjects ?? 0} sub={stats.lateSubmissions > 0 ? (lang === 'uk' ? `${stats.lateSubmissions} із запізненням` : `${stats.lateSubmissions} late`) : undefined} />
        <StatCard label={lang === 'uk' ? 'Середній бал' : 'Average score'} value={`${stats.averageScore ?? 0}`} color="text-primary" />
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={exportResults} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors">
          <Download className="h-4 w-4" /> {lang === 'uk' ? 'Результати CSV' : 'Results CSV'}
        </button>
        <button onClick={exportScores} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors">
          <Download className="h-4 w-4" /> {lang === 'uk' ? 'Оцінки CSV' : 'Scores CSV'}
        </button>
        <button onClick={exportFull} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <FileText className="h-4 w-4" /> {lang === 'uk' ? 'Повний звіт' : 'Full Report'}
        </button>
      </div>

      {/* Track tabs */}
      {tracks.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {tracks.map((t: any, i: number) => (
            <button key={t.trackId} onClick={() => setActiveTrackIdx(i)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTrackIdx === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {t.trackName}
            </button>
          ))}
        </div>
      )}

      {/* Results table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{activeTrack?.trackName ?? (lang === 'uk' ? 'Результати' : 'Results')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/20 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-center w-10">#</th>
                <th className="px-4 py-3 text-left">{lang === 'uk' ? 'Команда' : 'Team'}</th>
                <th className="px-4 py-3 text-left">{lang === 'uk' ? 'Проєкт' : 'Project'}</th>
                {(activeTrack?.ranked?.[0]?.perJudge ?? []).map((_j: any, i: number) => (
                  <th key={i} className="px-4 py-3 text-right text-nowrap">{lang === 'uk' ? `Суддя ${i + 1}` : `Judge ${i + 1}`}</th>
                ))}
                <th className="px-4 py-3 text-right">{lang === 'uk' ? 'Бал' : 'Score'}</th>
                <th className="px-4 py-3 text-center">{lang === 'uk' ? 'Нагорода' : 'Award'}</th>
                <th className="px-4 py-3 text-center">{lang === 'uk' ? 'Дія' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(activeTrack?.ranked ?? []).map((e: any) => (
                <tr key={e.teamId} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-center font-bold">
                    {e.position === 1 ? '🥇' : e.position === 2 ? '🥈' : e.position === 3 ? '🥉' : e.position}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.teamName}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.members?.length ?? 0} {lang === 'uk' ? 'учасн.' : 'members'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium max-w-[180px] truncate">{e.project?.title ?? '—'}</div>
                    {e.project?.isLate && <span className="text-[10px] text-orange-500">⚠️ {lang === 'uk' ? 'Запізнення' : 'Late'}</span>}
                  </td>
                  {(e.perJudge ?? []).map((j: any, i: number) => (
                    <td key={i} className="px-4 py-3 text-right text-sm tabular-nums" title={j.judgeName}>{j.rawTotal}</td>
                  ))}
                  <td className="px-4 py-3 text-right font-black text-primary">{e.normalizedTotal.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center">
                    {e.award
                      ? <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">🏅 {e.award.name}</span>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.award ? (
                      <button onClick={() => removeAwardMut.mutate({ teamId: e.teamId, awardId: e.award.id })}
                        className="text-xs text-red-600 hover:underline">✕ {lang === 'uk' ? 'Скасувати' : 'Cancel'}</button>
                    ) : (
                      <button onClick={() => setAwardModal({ teamId: e.teamId, teamName: e.teamName })}
                        className="flex items-center gap-1 text-xs text-primary hover:underline mx-auto">
                        <Medal className="h-3 w-3" /> {lang === 'uk' ? 'Нагорода' : 'Award'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(activeTrack?.ranked ?? []).length === 0 && (
                <tr>
                  <td colSpan={20} className="px-4 py-10 text-center text-muted-foreground">
                    {lang === 'uk' ? 'Оцінених команд немає' : 'No scored teams yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disqualified section */}
      {disqualified.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="font-semibold text-sm text-red-700">
              {lang === 'uk' ? 'Дискваліфіковані' : 'Disqualified'} ({disqualified.length})
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/10 border-b border-border">
              <tr>
                <th className="px-4 py-2 text-left">{lang === 'uk' ? 'Команда' : 'Team'}</th>
                <th className="px-4 py-2 text-left">{lang === 'uk' ? 'Трек' : 'Track'}</th>
                <th className="px-4 py-2 text-left">{lang === 'uk' ? 'Причина' : 'Reason'}</th>
                <th className="px-4 py-2 text-center">{lang === 'uk' ? 'Дія' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {disqualified.map((t: any) => (
                <tr key={t.teamId} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{t.teamName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.trackName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">«{t.reason}»</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => reinstateTeamMut.mutate(t.teamId)} disabled={reinstateTeamMut.isPending}
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline mx-auto disabled:opacity-50">
                      <RotateCcw className="h-3 w-3" /> {lang === 'uk' ? 'Поновити' : 'Reinstate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Not submitted */}
      {notSubmitted.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm text-muted-foreground">
              {lang === 'uk' ? 'Не подали проєкт' : 'Not submitted'} ({notSubmitted.length})
            </span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {notSubmitted.map((t: any) => (
                <tr key={t.teamId} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{t.teamName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.trackName}</td>
                  <td className="px-4 py-3 text-xs">
                    {t.reason === 'NO_PROJECT' 
                      ? (lang === 'uk' ? '📭 Проєкт не подано' : '📭 Project not submitted') 
                      : t.reason === 'REJECTED' 
                        ? (lang === 'uk' ? '❌ Проєкт відхилено' : '❌ Project rejected') 
                        : (lang === 'uk' ? 'Не подали' : 'Not submitted')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Award modal */}
      {awardModal && (
        <AwardModal
          teamId={awardModal.teamId}
          teamName={awardModal.teamName}
          awards={awards}
          hackathonId={hackathonId}
          onClose={() => setAwardModal(null)}
        />
      )}
    </div>
  )
}
