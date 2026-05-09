import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import {
  Calendar, MapPin, Users, Globe, ExternalLink, ChevronLeft,
  ChevronDown, ChevronUp, BookOpen, Clock, Tag,
} from 'lucide-react'
import { hackathonsApi } from '@/api/hackathons'
import { useAuthStore } from '@/store/auth.store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/utils/format'
import { useHackathonStage } from '@/hooks/useHackathonStage'

// ── Track Accordion ────────────────────────────────────────────────────────────
function TrackAccordion({ track }: { track: any }) {
  const [open, setOpen] = useState(false)
  const hasManual = !!track.guidelines

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
              <BookOpen className="h-3 w-3" /> мануал
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
              <ReactMarkdown>{track.guidelines}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Організатори ще не заповнили детальний мануал для цього треку.
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
                  Зараз
                </span>
              )}
              {isFuture && <span className="text-xs text-muted-foreground">майбутній</span>}
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

  const { data, isLoading } = useQuery({
    queryKey: ['public-hackathon', id],
    queryFn: () => hackathonsApi.getById(id!),
    enabled: !!id,
  })

  const hackathon = data?.data?.data
  const { activeStage, canRegister: stageAllowsRegistration } = useHackathonStage(hackathon)

  const hasStages = hackathon != null && (hackathon.stages?.length ?? 0) > 0
  const now = new Date()
  const withinDates =
    hackathon != null &&
    new Date(hackathon.startDate) <= now &&
    now <= new Date(hackathon.endDate)
  const isRegistrationOpen = hasStages
    ? stageAllowsRegistration
    : hackathon?.status === 'PUBLISHED' && withinDates

  if (isLoading) return <div className="py-24"><LoadingSpinner size="lg" /></div>
  if (!hackathon) return <div className="py-24 text-center">Хакатон не знайдено</div>

  return (
    <div className="animate-fade-in space-y-8">
      <Link
        to={user ? '/app/hackathons' : '/'}
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Всі хакатони
      </Link>

      {/* Banner */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={hackathon.status} />
              {activeStage && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Етап: {activeStage.type}
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
                <Tag className="h-6 w-6 text-primary" /> Напрямки (Tracks)
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
                <Clock className="h-6 w-6 text-primary" /> Етапи хакатону
              </h2>
              <StageTimeline stages={hackathon.stages} activeStageId={activeStage?.id} />
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
                  <p className="font-medium">Дати проведення</p>
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
                  <p className="font-medium">Формат</p>
                  <p className="text-muted-foreground">
                    {hackathon.online ? 'Онлайн' : hackathon.location || 'TBA'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">Склад команди</p>
                  <p className="text-muted-foreground">
                    {hackathon.minTeamSize}–{hackathon.maxTeamSize} учасників
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
                Правила участі <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <div className="pt-4 border-t border-border">
              {!isRegistrationOpen ? (
                <button disabled className="flex w-full justify-center rounded-lg bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground cursor-not-allowed">
                  Реєстрація закрита
                </button>
              ) : !user ? (
                <Link
                  to="/register"
                  className="flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Увійти для реєстрації
                </Link>
              ) : (
                <Link
                  to={`/app/hackathons/${hackathon.id}`}
                  className="flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Подати заявку на участь
                </Link>
              )}
            </div>
          </div>

          {/* Tags */}
          {hackathon.tags && hackathon.tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Теги</h4>
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
        </div>
      </div>
    </div>
  )
}
