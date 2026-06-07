import { ExternalLink, Trophy, Users, FolderOpen, Star, Award, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/i18n'

// ── Medal colours ────────────────────────────────────────────────────────────
const PLACE_CONFIG: Record<number, { gradient: string; border: string; label: string }> = {
  1: { gradient: 'from-amber-400/20 via-yellow-300/10 to-amber-500/5', border: 'border-amber-400/60', label: '🥇' },
  2: { gradient: 'from-slate-400/20 via-gray-300/10 to-slate-500/5',   border: 'border-slate-400/60',  label: '🥈' },
  3: { gradient: 'from-orange-400/20 via-amber-300/10 to-orange-500/5', border: 'border-orange-400/60', label: '🥉' },
}
function getPlaceCfg(place: number) {
  return PLACE_CONFIG[place] ?? { gradient: 'from-primary/10 to-primary/5', border: 'border-primary/30', label: '🏅' }
}

// ── Resource chip ────────────────────────────────────────────────────────────
function ResourceChip({ url, typeName }: { url: string; typeName?: string | null }) {
  let label = typeName || url
  try { label = typeName || new URL(url).hostname.replace('www.', '') } catch { /* noop */ }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors">
      <ExternalLink className="h-3 w-3 shrink-0" />{label}
    </a>
  )
}

// ── Winner card ───────────────────────────────────────────────────────────────
function WinnerCard({ team, place }: { team: any; place: number }) {
  const { t } = useI18n()
  const cfg = getPlaceCfg(place)
  const project = team.project
  const award = team.award
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${cfg.gradient} ${cfg.border} p-5 flex flex-col gap-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl shrink-0">{cfg.label} <span className="text-base font-bold">{place}</span></span>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight truncate">{team.teamName}</p>
            {award && <span className="inline-block mt-0.5 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">🏅 {award.name}</span>}
          </div>
        </div>
        {team.normalizedTotal > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">{t.hackathonResults.scoreLabel}</p>
            <p className="text-lg font-bold text-primary">{Number(team.normalizedTotal).toFixed(1)}</p>
          </div>
        )}
      </div>
      {project ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <FolderOpen className="h-3.5 w-3.5" />{t.hackathonResults.projectLabel}
          </div>
          <p className="font-semibold text-sm">{project.title || t.hackathonResults.noProject}</p>
          {project.description && <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>}
          {project.resources?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.resources.map((r: any, i: number) => <ResourceChip key={i} url={r.url} typeName={r.typeName} />)}
            </div>
          )}
        </div>
      ) : <p className="text-xs text-muted-foreground italic">{t.hackathonResults.noProject}</p>}
      {team.members?.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Users className="h-3.5 w-3.5" />{t.hackathonResults.membersLabel}
          </div>
          {team.members.map((m: any, i: number) => {
            const initials = m.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{initials}</div>
                <span className="text-sm truncate">{m.fullName}</span>
                {m.role === 'captain' && <span className="text-[10px] text-primary/70 bg-primary/10 rounded px-1">★</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Ranked team row (expandable) ──────────────────────────────────────────────
function RankedTeamRow({ team, rank, maxScore }: { team: any; rank: number; maxScore: number }) {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()
  const project = team.project
  const pct = maxScore > 0 ? Math.min(100, (Number(team.normalizedTotal ?? 0) / maxScore) * 100) : 0
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left">
        <span className="w-7 text-center text-sm font-bold text-muted-foreground shrink-0">
          {rank <= 3 ? (['🥇','🥈','🥉'] as const)[rank-1] : rank}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{team.teamName}</p>
          {project?.title && <p className="text-xs text-muted-foreground truncate">{project.title}</p>}
        </div>
        {team.award && (
          <span className="hidden sm:inline text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
            🏅 {team.award.name}
          </span>
        )}
        <div className="hidden sm:flex items-center gap-2 w-24 shrink-0">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="text-sm font-bold text-primary w-12 text-right shrink-0">
          {team.normalizedTotal > 0 ? Number(team.normalizedTotal).toFixed(1) : '—'}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 bg-muted/10 space-y-3">
          {/* Project details */}
          {project && project.status !== 'DRAFT' ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />{t.hackathonResults.projectLabel}
              </p>
              <p className="font-semibold text-sm">{project.title}</p>
              {project.description && <p className="text-xs text-muted-foreground">{project.description}</p>}
              {project.resources?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {project.resources.map((r: any, i: number) => <ResourceChip key={i} url={r.url} typeName={r.typeName} />)}
                </div>
              )}
            </div>
          ) : <p className="text-xs text-muted-foreground italic">{t.hackathonResults.noProject}</p>}

          {/* Members */}
          {team.members?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Users className="h-3.5 w-3.5" />{t.hackathonResults.membersLabel}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {team.members.map((m: any, i: number) => (
                  <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {m.role === 'captain' ? '★ ' : ''}{m.fullName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Simple team card (not submitted / disqualified) ───────────────────────────
function SimpleTeamCard({ team, disqualified }: { team: any; disqualified?: boolean }) {
  const { t } = useI18n()
  const project = team.project
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{team.teamName}</p>
          {team.trackName && team.trackName !== 'Загальний' && (
            <span className="text-xs text-muted-foreground">🎯 {team.trackName}</span>
          )}
        </div>
        {disqualified && (
          <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />{t.hackathonResults.disqualifiedLabel}
          </span>
        )}
      </div>
      {project && project.status !== 'DRAFT' ? (
        <div className="space-y-1">
          <p className="text-sm font-medium">{project.title}</p>
          {project.description && <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>}
          {project.resources?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {project.resources.map((r: any, i: number) => <ResourceChip key={i} url={r.url} typeName={r.typeName} />)}
            </div>
          )}
        </div>
      ) : <p className="text-xs text-muted-foreground italic">{t.hackathonResults.notSubmittedLabel}</p>}
      {disqualified && team.reason && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">{team.reason}</p>
      )}
      {team.members?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {team.members.map((m: any, i: number) => (
            <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{m.fullName}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface HackathonResultsSectionProps {
  results: any
  isLoading?: boolean
  sectionRef?: React.RefObject<HTMLDivElement | null>
}

export function HackathonResultsSection({ results, isLoading, sectionRef }: HackathonResultsSectionProps) {
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-400/20 animate-pulse" />
          <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!results) return null

  // API shape: { tracks:[{trackId, trackName, ranked:[]}], disqualified:[], notSubmitted:[], stats, hackathonAwards }
  const tracks: any[] = results.tracks ?? []

  // Deduplicate all arrays by teamId to prevent backend duplicates
  function dedup(arr: any[]) {
    const seen = new Set<string>()
    return arr.filter(t => {
      const key = t.teamId ?? t.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const disqualified: any[] = dedup(results.disqualified ?? [])
  const notSubmitted: any[] = dedup(results.notSubmitted ?? [])

  // All ranked teams across tracks, sorted by score descending — deduplicated
  const allRanked: any[] = dedup(tracks.flatMap((tr: any) => tr.ranked ?? []))
  const sortedRanked = [...allRanked].sort((a, b) => b.normalizedTotal - a.normalizedTotal)
  const maxScore = sortedRanked.length > 0 ? Math.max(...sortedRanked.map((t: any) => Number(t.normalizedTotal ?? 0)), 1) : 1

  // Winners = ONLY teams with explicitly assigned awards, sorted by award.place
  const winners = [...sortedRanked.filter((t: any) => t.award != null)]
    .sort((a, b) => (a.award?.place ?? 99) - (b.award?.place ?? 99))

  const isEmpty = allRanked.length === 0 && disqualified.length === 0 && notSubmitted.length === 0

  return (
    <div className="space-y-10" ref={sectionRef}>
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
          <Trophy className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t.hackathonResults.sectionTitle}</h2>
          {results.stats && (
            <p className="text-sm text-muted-foreground">
              {allRanked.length} у рейтингу
              {notSubmitted.length > 0 && ` · ${notSubmitted.length} не подали проєкт`}
              {disqualified.length > 0 && ` · ${disqualified.length} дискваліфіковано`}
            </p>
          )}
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center space-y-2">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">{t.hackathonResults.noResults}</p>
          <p className="text-sm text-muted-foreground/70">{t.hackathonResults.noResultsDesc}</p>
        </div>
      )}

      {/* Winners podium — only if awards explicitly assigned */}
      {winners.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />{t.hackathonResults.winnersTitle}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {winners.map((team: any) => (
              <WinnerCard key={team.teamId} team={team} place={team.award.place} />
            ))}
          </div>
        </div>
      )}

      {/* Ranked teams — expandable rows with project details */}
      {sortedRanked.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {t.hackathonResults.allTeamsTitle}
            <span className="text-sm font-normal text-muted-foreground">({sortedRanked.length})</span>
          </h3>
          <div className="space-y-2">
            {sortedRanked.map((team: any, i: number) => (
              <RankedTeamRow key={team.teamId} team={team} rank={i + 1} maxScore={maxScore} />
            ))}
          </div>
        </div>
      )}

      {/* Not submitted */}
      {notSubmitted.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            Не подали проєкт
            <span className="text-sm font-normal">({notSubmitted.length})</span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {notSubmitted.map((team: any) => (
              <SimpleTeamCard key={team.teamId} team={team} />
            ))}
          </div>
        </div>
      )}

      {/* Disqualified */}
      {disqualified.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            {t.hackathonResults.disqualifiedLabel}
            <span className="text-sm font-normal">({disqualified.length})</span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {disqualified.map((team: any) => (
              <SimpleTeamCard key={team.teamId} team={team} disqualified />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
