import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar as CalendarIcon, Video, CheckCircle, XCircle, Clock, Bell, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { mentorshipApi } from '@/api/mentorship'
import { formatRelativeTime } from '@/utils/format'
import { useI18n } from '@/i18n'

function fmtTime(d: Date) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
function fmtDayLabel(d: Date, t: any) { return `${t.mentor.daysFull[d.getDay()]}, ${d.getDate()} ${t.mentor.monthsFull[d.getMonth()]}` }
function minutesUntil(d: Date) { return Math.floor((d.getTime() - Date.now()) / 60000) }

type FilterType = 'all' | 'accepted' | 'completed' | 'cancelled'

export function MentorSlotsPage() {
  const qc = useQueryClient()
  const { t } = useI18n()
  const [filter, setFilter] = useState<FilterType>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmTimer, setConfirmTimer] = useState(0)
  const [alertDismissed, setAlertDismissed] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const timerRef  = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const EMPTY_MESSAGES: Record<FilterType, string> = {
    all:       t.mentor.noBookedSessions,
    accepted:  t.mentor.noUpcomingSessions,
    completed: t.mentor.noCompletedSessions,
    cancelled: t.mentor.noCancelledSessions,
  }

  // Poll time every 60s for upcoming session detection
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const { data: availData, isLoading } = useQuery({
    queryKey: ['my-availabilities'],
    queryFn: () => mentorshipApi.getMyAvailabilities().then(r => r.data.data),
  })

  // Flatten all slots from all availabilities
  const allSlots: any[] = useMemo(() => {
    if (!availData) return []
    return (availData as any[]).flatMap((av: any) =>
      (av.slots || []).map((s: any) => ({ ...s, trackName: av.track?.name || t.judge.noTrack }))
    ).sort((a: any, b: any) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
  }, [availData, t])

  const acceptedSlots = allSlots.filter(s => s.status === 'accepted')

  // Stats
  const stats = [
    { label: t.mentor.allStats, value: allSlots.length,                                         icon: CalendarIcon, color: 'text-primary' },
    { label: t.mentor.completed, value: allSlots.filter(s => s.status === 'completed').length,    icon: CheckCircle,  color: 'text-green-600' },
    { label: t.mentor.accepted, value: acceptedSlots.length,                                   icon: Clock,        color: 'text-blue-600' },
    { label: t.mentor.cancelled, value: allSlots.filter(s => s.status === 'cancelled').length,   icon: XCircle,      color: 'text-muted-foreground' },
  ]

  // Today panel
  const todayStr  = now.toDateString()
  const todaySlots = acceptedSlots.filter(s => new Date(s.startDatetime).toDateString() === todayStr)
  const nextSlot   = todaySlots.find(s => new Date(s.startDatetime) > now)
  const minsToNext = nextSlot ? minutesUntil(new Date(nextSlot.startDatetime)) : null
  const isImminent = minsToNext !== null && minsToNext <= 30 && minsToNext >= 0

  // Upcoming alert (≤15 min)
  const alertSlot = acceptedSlots.find(s => {
    const mins = minutesUntil(new Date(s.startDatetime))
    return mins <= 15 && mins >= 0
  })
  const alertKey = alertSlot?.id || null
  const showAlert = alertSlot && alertKey !== alertDismissed

  // Inline confirm timeout
  const startConfirm = (id: string) => {
    setConfirmId(id)
    setConfirmTimer(3)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setConfirmTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setConfirmId(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const completeMut = useMutation({
    mutationFn: (id: string) => mentorshipApi.completeRequest(id),
    // Optimistic update
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['my-availabilities'] })
      const prev = qc.getQueryData(['my-availabilities'])
      qc.setQueryData(['my-availabilities'], (old: any) => {
        if (!old) return old
        return old.map((av: any) => ({
          ...av,
          slots: (av.slots || []).map((s: any) => s.id === id ? { ...s, status: 'completed' } : s),
        }))
      })
      return { prev }
    },
    onError: (_err, _id, ctx: any) => {
      qc.setQueryData(['my-availabilities'], ctx.prev)
      alert(t.states.error)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['my-availabilities'] }),
  })

  const handleConfirmComplete = (id: string) => {
    clearInterval(timerRef.current)
    setConfirmId(null)
    completeMut.mutate(id)
  }

  // Filtered + grouped by date
  const grouped = useMemo(() => {
    const filtered = filter === 'all' ? allSlots : allSlots.filter(s => s.status === filter)
    const map = new Map<string, any[]>()
    filtered.forEach(s => {
      const key = new Date(s.startDatetime).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    })
    return map
  }, [allSlots, filter])

  if (isLoading) return <div className="py-24"><LoadingSpinner /></div>

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
      <PageHeader title={t.mentor.sessionsTitle} subtitle={t.mentor.sessionsSubtitle} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></div>
            <Icon className={`h-8 w-8 opacity-20 ${color}`} />
          </div>
        ))}
      </div>

      {/* Today panel */}
      {todaySlots.length > 0 && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-800 rounded-full mt-0.5">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-100">
                📅 {t.mentor.todaySessionsCount(todaySlots.length)}
              </h3>
              {nextSlot && minsToNext !== null && (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {minsToNext > 0
                    ? t.mentor.nextSessionInfo(nextSlot.team?.name || t.resultsTab.team, fmtTime(new Date(nextSlot.startDatetime)), String(minsToNext))
                    : t.mentor.nextSessionInfoNow(nextSlot.team?.name || t.resultsTab.team, fmtTime(new Date(nextSlot.startDatetime)))}
                </p>
              )}
            </div>
          </div>
          {nextSlot?.meetingLink && (
            <a
              href={nextSlot.meetingLink}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                isImminent
                  ? 'bg-green-600 text-white hover:bg-green-700 animate-pulse'
                  : 'bg-white dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-700 hover:bg-blue-50'
              }`}
            >
              <Video className="h-4 w-4" />
              {isImminent ? t.mentor.joinNow : t.mentor.openMeetingLink}
            </a>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border pb-1">
        {([
          { key: 'all',       label: t.states.all },
          { key: 'accepted',  label: t.mentor.filterScheduled },
          { key: 'completed', label: t.mentor.filterCompleted },
          { key: 'cancelled', label: t.mentor.filterCancelled },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${filter === f.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sessions grouped by date */}
      {grouped.size === 0 ? (
        <EmptyState title={EMPTY_MESSAGES[filter]} description={t.shared.emptyState.defaultDesc} />
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateKey, slots]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {fmtDayLabel(new Date(slots[0].startDatetime), t)}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-3">
                {slots.map((slot: any) => {
                  const start = new Date(slot.startDatetime)
                  const end   = new Date(slot.endDatetime)
                  const durMins = Math.round((end.getTime() - start.getTime()) / 60000)
                  const mins  = minutesUntil(start)
                  const slotImminent = slot.status === 'accepted' && mins >= 0 && mins <= 30
                  const isCompleted = slot.status === 'completed'
                  const isCancelled = slot.status === 'cancelled'

                  return (
                    <div key={slot.id} className={`rounded-xl border bg-card shadow-sm p-5 space-y-3 transition-all ${
                      isCompleted ? 'opacity-70 border-border' :
                      isCancelled ? 'border-destructive/20 bg-destructive/5' :
                      slotImminent ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' :
                      'border-border hover:border-primary/30'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold">{fmtTime(start)} – {fmtTime(end)} <span className="text-xs text-muted-foreground font-normal">({durMins} {t.mentorsTab.minutes})</span></p>
                          <p className="text-sm">{t.mentor.teamLabel}<span className="font-medium">{slot.team?.name || t.adminDashboardPage.notSpecified}</span></p>
                          <p className="text-sm text-muted-foreground">{t.mentor.trackLabel}{slot.trackName}</p>
                          {slot.meetingLink && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              🔗 <span className="font-mono text-xs truncate max-w-[200px]">{slot.meetingLink}</span>
                              <a href={slot.meetingLink} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">{t.mentor.openLink}</a>
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {isCompleted && (
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                              <CheckCircle className="h-3.5 w-3.5" /> {t.mentor.completedAgo(formatRelativeTime(slot.updatedAt))}
                            </span>
                          )}
                          {isCancelled && (
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                              <XCircle className="h-3.5 w-3.5" /> {t.mentor.cancelled}
                            </span>
                          )}
                          {!isCompleted && !isCancelled && (
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              end < now ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {end < now ? t.mentor.timePassed : t.mentor.bookedStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!isCompleted && !isCancelled && end > now && (
                        <div className="flex items-center gap-2 pt-1 border-t border-border">
                          {slot.meetingLink && slotImminent && (
                            <a href={slot.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 animate-pulse">
                              <Video className="h-4 w-4" /> {t.mentor.joinNow}
                            </a>
                          )}
                          {confirmId === slot.id ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleConfirmComplete(slot.id)} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">
                                {t.mentor.confirmBtn(confirmTimer)}
                              </button>
                              <button onClick={() => { setConfirmId(null); clearInterval(timerRef.current) }} className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">
                                {t.actions.cancel}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startConfirm(slot.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors">
                              {t.mentor.markCompleted}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fixed bottom alert — ≤15 min */}
      {showAlert && alertSlot && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
          <div className="bg-card border border-primary/40 rounded-xl shadow-2xl p-4 flex items-center gap-4 max-w-lg w-full pointer-events-auto">
            <Bell className="h-5 w-5 text-primary shrink-0 animate-bounce" />
            <p className="flex-1 text-sm font-semibold">
              ⏰ {t.mentor.sessionStartsIn(alertSlot.team?.name || t.teamTab.member, minutesUntil(new Date(alertSlot.startDatetime)))}
            </p>
            {alertSlot.meetingLink && (
              <a href={alertSlot.meetingLink} target="_blank" rel="noreferrer" className="shrink-0 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                {t.mentor.joinArrow}
              </a>
            )}
            <button onClick={() => setAlertDismissed(alertKey)} className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
