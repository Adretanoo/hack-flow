import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import {
  Calendar, MapPin, Users, Globe, ExternalLink, ChevronLeft,
  ChevronDown, ChevronUp, BookOpen, Clock, Tag, Trophy,
} from 'lucide-react'
import { hackathonsApi } from '@/api/hackathons'
import { teamsApi } from '@/api/teams'
import { useAuthStore } from '@/store/auth.store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { HackathonResultsSection } from '@/components/shared/HackathonResultsSection'
import { formatDate } from '@/utils/format'
import { useHackathonStage } from '@/hooks/useHackathonStage'
import { useI18n } from '@/i18n'

// ── Track Accordion ────────────────────────────────────────────────────────────
function TrackAccordion({ track }: { track: any }) {
  const [open, setOpen] = useState(false)
  const hasManual = !!track.guidelines
  const { t } = useI18n()

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{track.name}</p>
            {track.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{track.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {hasManual && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
              <BookOpen className="h-3 w-3" /> {t.publicHackathon.manual}
            </span>
          )}
          {open
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5 bg-muted/10">
          {hasManual ? (
            <div className="prose prose-sm max-w-none
              prose-headings:font-semibold prose-headings:text-foreground
              prose-p:text-foreground prose-p:leading-relaxed
              prose-li:text-foreground prose-strong:text-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-code:bg-muted prose-code:px-1 prose-code:rounded
              prose-blockquote:border-primary prose-blockquote:text-muted-foreground
            ">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{track.guidelines}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              {t.publicHackathon.noManual}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Stage Timeline (public — no task reveal) ──────────────────────────────────
function StageTimeline({ stages, activeStageId }: { stages: any[]; activeStageId?: string }) {
  const now = new Date()
  const { t } = useI18n()

  return (
    <div className="space-y-2">
      {stages.map((s) => {
        const isActive = s.id === activeStageId
        const isPast = new Date(s.endDate) < now
        const isFuture = new Date(s.startDate) > now

        return (
          <div key={s.id} className={`rounded-lg border px-4 py-3 flex items-center justify-between ${
            isActive ? 'border-primary/50 bg-primary/5' :
            isPast ? 'border-border bg-muted/20 opacity-60' :
            'border-border bg-card'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full shrink-0 ${
                isActive ? 'bg-primary animate-pulse' :
                isPast ? 'bg-muted-foreground/40' : 'bg-muted-foreground/20'
              }`} />
              <span className={`text-sm font-medium ${isPast ? 'text-muted-foreground' : ''}`}>
                {s.name}
              </span>
              {isActive && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {t.publicHackathon.currentStage}
                </span>
              )}
              {isFuture && <span className="text-xs text-muted-foreground">{t.publicHackathon.futureStage}</span>}
            </div>
            <span className="text-xs text-muted-foreground shrink-0 ml-3">
              {formatDate(s.startDate)} — {formatDate(s.endDate)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function HackathonPublicPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const { t } = useI18n()
  const resultsRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['public-hackathon', id],
    queryFn: () => hackathonsApi.getById(id!),
    enabled: !!id,
  })

  const hackathon = data?.data?.data
  const { activeStage, canRegister: stageAllowsRegistration } = useHackathonStage(hackathon)

  const now = new Date()
  const isPast =
    hackathon != null && (
      new Date(hackathon.endDate) < now ||
      activeStage?.type === 'FINISHED' ||
      hackathon.status === 'ARCHIVED'
    )

  // Fetch results only for past/archived hackathons
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['hackathon-results', id],
    queryFn: () => hackathonsApi.getResults(id!),
    enabled: !!id && !!isPast,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  })

  // Fetch user's team status for this hackathon
  const { data: myTeamData } = useQuery({
    queryKey: ['my-team-public', id, user?.id],
    queryFn: () => teamsApi.getMyTeam(id!).then(r => r.data?.data ?? null),
    enabled: !!id && !!user,
    retry: false,
    staleTime: 0,               // always re-fetch fresh data
    refetchOnWindowFocus: true, // refetch when user switches back to tab
    refetchInterval: 15_000,    // poll every 15s to catch admin status changes
  })
  const myTeam = myTeamData ?? null

  const hasStages = hackathon != null && (hackathon.stages?.length ?? 0) > 0
  const withinDates =
    hackathon != null &&
    new Date(hackathon.startDate) <= now &&
    now <= new Date(hackathon.endDate)
  const isRegistrationOpen = hasStages
    ? stageAllowsRegistration
    : hackathon?.status === 'PUBLISHED' && withinDates

  if (isLoading) return <div className="py-24"><LoadingSpinner size="lg" /></div>
  if (!hackathon) return <div className="py-24 text-center">{t.publicHackathon.hackathonNotFound}</div>

  const results = resultsData?.data?.data

  return (
    <div className="animate-fade-in space-y-8">
      <Link
        to={user ? '/app/hackathons' : '/'}
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> {t.publicHackathon.allHackathons}
      </Link>

      {/* Banner */}
      <div className={`relative h-48 sm:h-64 w-full overflow-hidden rounded-2xl ${
        hackathon.status === 'ARCHIVED'
          ? 'bg-gradient-to-r from-slate-500 to-slate-700'
          : 'bg-gradient-to-r from-blue-500 to-indigo-600'
      }`}>
        <div className="absolute inset-0 bg-black/20" />
        {hackathon.status === 'ARCHIVED' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/80 space-y-1">
              <Trophy className="mx-auto h-12 w-12 text-amber-400 drop-shadow" />
              <p className="text-sm font-semibold tracking-widest uppercase">Завершено</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={
                hackathon.status === 'PUBLISHED'
                  ? (now > new Date(hackathon.endDate) || activeStage?.type === 'FINISHED' ? 'past' : (now < new Date(hackathon.startDate) ? 'upcoming' : 'active'))
                  : hackathon.status
              } />
              {activeStage && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {t.publicHackathon.stageLabel}: {activeStage.type === 'CUSTOM' ? activeStage.name : activeStage.type}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">{hackathon.title}</h1>
            {hackathon.subtitle && (
              <p className="text-xl text-muted-foreground">{hackathon.subtitle}</p>
            )}
          </div>

          {/* Description */}
          {hackathon.description && (
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <ReactMarkdown>{hackathon.description}</ReactMarkdown>
            </div>
          )}

          {/* Tracks — accordion */}
          {hackathon.tracks && hackathon.tracks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Tag className="h-6 w-6 text-primary" /> {t.publicHackathon.tracksTitle}
              </h2>
              <div className="space-y-3">
                {hackathon.tracks.map((track: any) => (
                  <TrackAccordion key={track.id} track={track} />
                ))}
              </div>
            </div>
          )}

          {/* Stages — timeline */}
          {hackathon.stages && hackathon.stages.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" /> {t.publicHackathon.stagesTitle}
              </h2>
              <StageTimeline stages={hackathon.stages} activeStageId={activeStage?.id} />
            </div>
          )}

          {isPast && (
            <div className="border-t border-border pt-8">
              <HackathonResultsSection
                results={results}
                isLoading={resultsLoading}
                sectionRef={resultsRef}
              />
            </div>
          )}
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">{t.publicHackathon.datesTitle}</p>
                  <p className="text-muted-foreground">
                    {formatDate(hackathon.startDate)} — {formatDate(hackathon.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                {hackathon.online
                  ? <Globe className="h-5 w-5 text-primary shrink-0" />
                  : <MapPin className="h-5 w-5 text-primary shrink-0" />}
                <div>
                  <p className="font-medium">{t.publicHackathon.formatTitle}</p>
                  <p className="text-muted-foreground">
                    {hackathon.online ? t.publicHackathon.onlineFormat : hackathon.location || 'TBA'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">{t.publicHackathon.teamCompositionTitle}</p>
                  <p className="text-muted-foreground">
                    {hackathon.minTeamSize}–{hackathon.maxTeamSize} {t.publicHackathon.teamCompositionDesc}
                  </p>
                </div>
              </div>
            </div>

            {hackathon.rulesUrl && (
              <a
                href={hackathon.rulesUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                {t.publicHackathon.rulesButton} <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <div className="pt-4 border-t border-border">
              {isPast ? (
                <button
                  onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500/10 border border-amber-400/30 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <Trophy className="h-4 w-4" />
                  Переглянути підсумки та переможців
                </button>
              ) : myTeam ? (
                /* User already has a team — show status */
                <div className="space-y-3">
                  <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium border ${
                    myTeam.approvalStatus === 'APPROVED'
                      ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400'
                      : myTeam.approvalStatus === 'REJECTED'
                        ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'
                        : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400'
                  }`}>
                    <span className="font-semibold">
                      {myTeam.approvalStatus === 'APPROVED' ? '✅ Команду схвалено'
                        : myTeam.approvalStatus === 'REJECTED' ? '❌ Команду відхилено'
                        : '⏳ Очікує розгляду'}
                    </span>
                    <StatusBadge status={myTeam.approvalStatus} />
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Команда: <span className="font-semibold text-foreground">{myTeam.name}</span>
                  </div>
                  <Link
                    to={`/app/hackathons/${hackathon.id}`}
                    className="flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    {t.publicHackathon.applyButton}
                  </Link>
                </div>
              ) : !isRegistrationOpen ? (
                <button disabled className="flex w-full justify-center rounded-lg bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground cursor-not-allowed">
                  {t.publicHackathon.registrationClosed}
                </button>
              ) : !user ? (
                <Link
                  to="/register"
                  className="flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  {t.publicHackathon.loginToRegister}
                </Link>
              ) : (
                <Link
                  to={`/app/hackathons/${hackathon.id}`}
                  className="flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  {t.publicHackathon.applyButton}
                </Link>
              )}
            </div>
          </div>

          {/* Tags */}
          {hackathon.tags && hackathon.tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{t.publicHackathon.tagsTitle}</h4>
              <div className="flex flex-wrap gap-2">
                {hackathon.tags.map((tag: any) => (
                  <span
                    key={tag.id || tag.tag?.id}
                    className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {tag.name || tag.tag?.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats for finished hackathons */}
          {isPast && hackathon._count && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Статистика</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{hackathon._count.teams ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t.homePage.teams}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{hackathon._count.participants ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t.homePage.participants}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
