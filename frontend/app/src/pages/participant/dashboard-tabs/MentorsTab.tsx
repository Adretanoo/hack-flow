import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Lock, CalendarDays, Video, X } from 'lucide-react'
import { mentorshipApi } from '@/api/mentorship'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useNotificationsStore } from '@/store/notifications.store'
import type { Hackathon, Team } from '@/types/api.types'
import { useI18n } from '@/i18n'

function fmtTime(dt: Date) { return dt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false }) }
function isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString() }

function fmtRange(days: Date[], t: any) {
  const f = days[0], l = days[6]
  const monthsFull = t.mentorsTab.monthsFull
  const months = t.mentorsTab.months
  if (f.getMonth() === l.getMonth()) return `${f.getDate()}–${l.getDate()} ${monthsFull[f.getMonth()]} ${f.getFullYear()}`
  return `${f.getDate()} ${months[f.getMonth()]} – ${l.getDate()} ${months[l.getMonth()]} ${l.getFullYear()}`
}

interface MentorsTabProps { hackathon: Hackathon; myTeam?: Team; stageInfo: any }

export function MentorsTab({ hackathon, myTeam, stageInfo }: MentorsTabProps) {
  const qc = useQueryClient()
  const { t } = useI18n()
  const { addMentorCancellation } = useNotificationsStore()
  const TODAY = useMemo(() => new Date(), [])
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedAvail, setSelectedAvail] = useState<any>(null)
  const [cancelConfirm, setCancelConfirm] = useState<{ open: boolean; id: string; mentorName: string }>({ open: false, id: '', mentorName: '' })
  const prevBookingsRef = useRef<any[]>([])

  const STATUS_STYLE: Record<string, { card: string; badge: string; label: string; dot: string }> = {
    pending:   { card: 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700',  badge: 'bg-amber-100 text-amber-700',   label: `⏳ ${t.mentor.pending}`,       dot: 'bg-amber-400' },
    accepted:  { card: 'bg-blue-50  border-blue-300  dark:bg-blue-900/20  dark:border-blue-700',   badge: 'bg-blue-100  text-blue-700',    label: `✓ ${t.mentor.accepted}`, dot: 'bg-blue-500'  },
    completed: { card: 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700',  badge: 'bg-green-100 text-green-700',   label: `✅ ${t.mentor.completed}`,    dot: 'bg-green-500' },
    cancelled: { card: 'bg-muted/40 border-border opacity-50',                                      badge: 'bg-muted text-muted-foreground', label: `✗ ${t.mentor.cancelled}`,    dot: 'bg-muted-foreground' },
    rejected:  { card: 'bg-muted/40 border-border opacity-50',                                      badge: 'bg-muted text-muted-foreground', label: `✗ ${t.mentor.declined}`,    dot: 'bg-red-400'   },
  }

  const weekDates = useMemo(() => {
    const day = TODAY.getDay()
    const monday = new Date(TODAY)
    monday.setDate(TODAY.getDate() + (day === 0 ? -6 : 1 - day) + weekOffset * 7)
    monday.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
  }, [TODAY, weekOffset])

  const { data: mentorsData, isLoading: mentorsLoading } = useQuery({
    queryKey: ['mentors', hackathon.id],
    queryFn: () => mentorshipApi.getAvailableMentors({ hackathonId: hackathon.id }),
    enabled: stageInfo.canBookMentor,
    refetchInterval: 5_000,
    staleTime: 3_000,
  })

  const { data: myBookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings', myTeam?.id],
    queryFn: () => mentorshipApi.getMyRequests(myTeam!.id),
    enabled: !!myTeam?.id,
    refetchInterval: 5_000,
    staleTime: 3_000,
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => mentorshipApi.cancelRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
  })

  const myBookings: any[] = myBookingsData?.data?.data || []
  useEffect(() => {
    const prev = prevBookingsRef.current
    if (prev.length > 0) {
      for (const curr of myBookings) {
        const old = prev.find(b => b.id === curr.id)
        if (!old || old.status === curr.status) continue
        if (curr.status === 'cancelled' || curr.status === 'rejected') {
          const mentorName = curr.availability?.mentor?.fullName ||
            curr.mentorAvailability?.user?.fullName || t.mentorsPage.mentor
          const dt = new Date(curr.startDatetime)
          addMentorCancellation({
            id: `booking-${curr.status}-${curr.id}`,
            status: 'SLOT_CANCELLED',
            title: curr.status === 'rejected' ? `❌ ${t.mentor.declined}` : `🗓️ ${t.mentor.cancelled}`,
            body: `${mentorName} — ${dt.toLocaleDateString('uk-UA')} o ${dt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} (${curr.durationMinute} ${t.mentorsTab.minutes})`,
            teamName: myTeam?.name || '',
            hackathonTitle: hackathon.title,
            timestamp: new Date().toISOString(),
          })
        }
      }
    }
    prevBookingsRef.current = myBookings
  }, [myBookings])

  if (!stageInfo.canBookMentor) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center gap-4">
        <Lock className="h-12 w-12 text-muted-foreground/30" />
        <h3 className="text-xl font-semibold">{t.mentorsTab.bookingUnavailable}</h3>
        <p className="text-muted-foreground text-sm max-w-md">{t.mentorsTab.bookingUnavailableDesc}</p>
      </div>
    )
  }
  if (!myTeam) return <div className="py-24 text-center text-muted-foreground">{t.projectTab.joinTeamFirst}</div>

  const mentors: any[] = mentorsData?.data?.data || []

  const CALENDAR_STATUSES = new Set(['pending', 'accepted', 'completed'])
  const myBookingsByDate = useMemo(() => {
    const map = new Map<string, any[]>()
    weekDates.forEach(d => map.set(d.toDateString(), []))
    myBookings
      .filter(b => CALENDAR_STATUSES.has(b.status))
      .forEach(b => {
        const k = new Date(b.startDatetime).toDateString()
        if (map.has(k)) map.get(k)!.push(b)
      })
    return map
  }, [myBookings, weekDates])

  const availByDate = useMemo(() => {
    const map = new Map<string, any[]>()
    weekDates.forEach(d => map.set(d.toDateString(), []))
    for (const av of mentors) {
      const k = new Date(av.startDatetime).toDateString()
      if (map.has(k)) map.get(k)!.push(av)
    }
    return map
  }, [mentors, weekDates])

  const hasAnything = weekDates.some(d => (myBookingsByDate.get(d.toDateString())?.length || 0) + (availByDate.get(d.toDateString())?.length || 0) > 0)

  const pastBookings = myBookings.filter(b => b.status !== 'pending' && b.status !== 'accepted')

  return (
    <div className="mt-6 space-y-6">

      {/* ── Week navigation ── */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg hover:bg-accent transition-colors"><ChevronLeft className="h-5 w-5" /></button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-sm flex items-center justify-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" />{fmtRange(weekDates, t)}</p>
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline">← {t.mentorsTab.today}</button>}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg hover:bg-accent transition-colors"><ChevronRight className="h-5 w-5" /></button>
      </div>

      {/* ── Weekly calendar grid ── */}
      {mentorsLoading || bookingsLoading ? <div className="py-12"><LoadingSpinner /></div> : (
        <div className="overflow-x-auto -mx-1 px-1 pb-2">
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', minWidth: '910px' }}>
            {weekDates.map(date => {
              const isToday = isSameDay(date, TODAY)
              const isPast = date < TODAY && !isToday
              const dayBookings = myBookingsByDate.get(date.toDateString()) || []
              const dayAvails = availByDate.get(date.toDateString()) || []

              const freeSlots: { avail: any; time: string; dt: Date }[] = []
              for (const av of dayAvails) {
                const start = new Date(av.startDatetime), end = new Date(av.endDatetime), dur = av.slotDuration || 30
                const notFree = (av.slots || [])
                  .filter((s: any) => s.status === 'pending' || s.status === 'accepted' || s.status === 'blocked')
                  .map((s: any) => new Date(s.startDatetime).getTime())
                const now = new Date()
                let cur = new Date(start)
                while (cur < end) {
                  if (!notFree.some((t: number) => Math.abs(t - cur.getTime()) < 60000)) {
                    const dt = new Date(cur)
                    if (dt > now) {
                      freeSlots.push({ avail: av, time: fmtTime(dt), dt })
                    }
                  }
                  cur = new Date(cur.getTime() + dur * 60000)
                }
              }

              const blockedSlots: { time: string; mentorName: string }[] = []
              for (const av of dayAvails) {
                const blocked = (av.slots || []).filter((s: any) => s.status === 'blocked')
                for (const s of blocked) {
                  const dt = new Date(s.startDatetime)
                  blockedSlots.push({
                    time: fmtTime(dt),
                    mentorName: av.mentor?.fullName?.split(' ')[0] || t.mentorsPage.mentor,
                  })
                }
              }

              return (
                <div key={date.toDateString()} className="flex flex-col gap-1.5 min-w-0">
                  {/* Day header */}
                  <div className={`rounded-xl p-2 text-center transition-all ${isToday ? 'bg-primary shadow-md shadow-primary/20' : 'bg-card border border-border'}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{t.mentorsTab.days[date.getDay()]}</p>
                    <p className={`text-base font-bold leading-tight ${isToday ? 'text-primary-foreground' : isPast ? 'text-muted-foreground/40' : ''}`}>{date.getDate()}</p>
                    <p className={`text-[9px] ${isToday ? 'text-primary-foreground/60' : 'text-muted-foreground/50'}`}>{t.mentorsTab.months[date.getMonth()]}</p>
                  </div>

                  {/* My bookings for this day */}
                  {dayBookings.map(b => {
                    const dt = new Date(b.startDatetime)
                    const endDt = new Date(dt.getTime() + (b.durationMinute || 30) * 60000)
                    const isPassed = endDt < new Date()
                    
                    let st = STATUS_STYLE[b.status] || STATUS_STYLE.cancelled
                    if (isPassed && b.status === 'accepted') {
                      st = { ...st, label: `🕒 ${t.mentorsTab.timePassed}`, card: 'bg-muted/40 border-border opacity-50 grayscale', badge: 'bg-muted text-muted-foreground' }
                    }

                    const mentorName = b.mentorAvailability?.user?.fullName || b.mentorAvailability?.mentor?.fullName || t.mentorsPage.mentor
                    return (
                      <div key={b.id} className={`rounded-xl border-2 p-2.5 transition-all ${st.card}`}>
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="font-bold text-xs">{fmtTime(dt)}</p>
                            <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{mentorName}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${st.badge}`}>{st.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{b.durationMinute} {t.mentorsTab.minutes}</p>
                        {b.status === 'accepted' && b.meetingLink && !isPassed && (
                          <a href={b.meetingLink} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-semibold">
                            <Video className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{t.mentorsTab.joinMeeting}</span>
                          </a>
                        )}
                        {(b.status === 'accepted' || b.status === 'pending') && !isPassed && (
                          <button onClick={() => setCancelConfirm({ open: true, id: b.id, mentorName })}
                            className="mt-1.5 w-full text-[10px] text-muted-foreground hover:text-destructive transition-colors text-left">
                            ✗ {t.actions.cancel}
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* Free available slots + blocked slots */}
                  {!isPast && (freeSlots.length > 0 || blockedSlots.length > 0) && (
                    <div className="space-y-1">
                      {freeSlots.slice(0, 3).map((s, i) => (
                        <button key={i} onClick={() => setSelectedAvail(s.avail)}
                          className="w-full rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 text-[10px] font-bold px-2 py-1.5 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors text-left">
                          {s.time} · {s.avail.mentor?.fullName?.split(' ')[0] || t.mentorsPage.mentor}
                        </button>
                      ))}
                      {freeSlots.length > 3 && (
                        <button onClick={() => setSelectedAvail(freeSlots[0].avail)} className="w-full text-[10px] text-primary hover:underline font-semibold text-left pl-1">
                          +{freeSlots.length - 3} {t.mentor.mySlots.split(' ')[1]}
                        </button>
                      )}
                      {blockedSlots.slice(0, 2).map((s, i) => (
                        <div key={`bl-${i}`} className="w-full rounded-lg bg-muted/50 border border-border/60 text-[10px] font-semibold px-2 py-1.5 text-muted-foreground/60 flex items-center gap-1 cursor-not-allowed">
                          <span>🔒</span><span>{s.time} · {t.mentorsTab.blocked}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {dayBookings.length === 0 && freeSlots.length === 0 && blockedSlots.length === 0 && (
                    <div className={`flex-1 rounded-xl border-2 border-dashed min-h-[60px] flex items-center justify-center ${isPast ? 'border-border/20 opacity-30' : 'border-border/40'}`}>
                      <span className="text-[9px] text-muted-foreground/40">{t.states.noData}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!hasAnything && !mentorsLoading && (
        <div className="text-center py-6">
          <p className="text-sm font-medium text-muted-foreground">{t.mentorsTab.noSlotsThisWeek}</p>
          <button onClick={() => setWeekOffset(w => w + 1)} className="mt-1.5 text-xs text-primary hover:underline">{t.mentorsTab.nextWeek}</button>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1">
        {[
          { cls: 'bg-teal-100 border-teal-300',   label: t.mentorsTab.available },
          { cls: 'bg-amber-100 border-amber-300',  label: t.mentor.pending },
          { cls: 'bg-blue-100 border-blue-300',    label: t.mentor.accepted },
          { cls: 'bg-green-100 border-green-300',  label: t.mentor.completed },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border-2 ${l.cls}`} />
            <span className="text-xs text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── History table ── */}
      {pastBookings.length > 0 && (
        <section>
          <h3 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wide">{t.mentorsTab.archive}</h3>
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[450px]">
                <thead className="text-xs text-muted-foreground border-b border-border bg-muted/10">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">{t.mentorsPage.mentor}</th>
                    <th className="px-4 py-2.5 text-left font-semibold">{t.mentorsTab.dateTime}</th>
                    <th className="px-4 py-2.5 text-left font-semibold">{t.mentorsTab.duration}</th>
                    <th className="px-4 py-2.5 text-left font-semibold">{t.teamTab.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pastBookings.map((b: any) => {
                    const st = STATUS_STYLE[b.status] || STATUS_STYLE.cancelled
                    const dt = new Date(b.startDatetime)
                    return (
                      <tr key={b.id} className="hover:bg-muted/10 transition-colors opacity-70">
                        <td className="px-4 py-3 font-medium text-sm">{b.mentorAvailability?.user?.fullName || t.mentorsPage.mentor}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{dt.getDate()} {t.mentorsTab.months[dt.getMonth()]}, {fmtTime(dt)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{b.durationMinute} {t.mentorsTab.minutes}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.badge}`}>{st.label}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Booking modal ── */}
      {selectedAvail && (
        <BookingModal avail={selectedAvail} teamId={myTeam.id}
          onClose={() => setSelectedAvail(null)}
          onBooked={() => { qc.invalidateQueries({ queryKey: ['my-bookings'] }); setSelectedAvail(null) }} />
      )}

      {/* ── Cancel confirm ── */}
      <ConfirmDialog open={cancelConfirm.open}
        title={t.mentorsTab.cancelSessionTitle}
        message={t.mentorsTab.cancelSessionConfirm.replace('{name}', cancelConfirm.mentorName)}
        confirmLabel={t.mentorsTab.confirmCancelBtn} cancelLabel={t.actions.no} danger
        onConfirm={() => { cancelMut.mutate(cancelConfirm.id); setCancelConfirm({ open: false, id: '', mentorName: '' }) }}
        onCancel={() => setCancelConfirm({ open: false, id: '', mentorName: '' })} />
    </div>
  )
}

function BookingModal({ avail, teamId, onClose, onBooked }: any) {
  const [selected, setSelected] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { t } = useI18n()

  const { data, isLoading } = useQuery({
    queryKey: ['mentor-requests', avail.id],
    queryFn: () => mentorshipApi.getMentorRequests(avail.id).then(r => r.data.data),
  })

  const requestMut = useMutation({
    mutationFn: (d: any) => mentorshipApi.createRequest({ mentorAvailabilityId: avail.id, teamId, startDatetime: d.startDatetime, durationMinute: d.duration, message: d.message }),
    onSuccess: () => onBooked(),
    onError: (e: any) => alert(e.message || t.states.error),
  })

  const requests = data || []
  const start = new Date(avail.startDatetime), end = new Date(avail.endDatetime), dur = avail.slotDuration || 30
  const slots: any[] = []
  let cur = new Date(start)
  for (let i = 0; i < Math.floor((end.getTime() - start.getTime()) / 60000 / dur); i++) {
    const dt = new Date(cur)
    const req = requests.find((r: any) => Math.abs(new Date(r.startDatetime).getTime() - dt.getTime()) < 60000 && r.status !== 'rejected' && r.status !== 'cancelled')
    slots.push({ id: `s-${i}`, startDatetime: dt.toISOString(), durationMinute: dur, request: req })
    cur = new Date(cur.getTime() + dur * 60000)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
            <div>
              <h3 className="font-bold">{avail.mentor?.fullName || avail.user?.fullName || t.mentorsPage.mentor}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(avail.startDatetime).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} · {avail.slotDuration || 30} {t.mentorsTab.minPerSlot}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors"><X className="h-5 w-5" /></button>
          </div>
          <div className="overflow-y-auto p-4 flex-1">
            {isLoading ? <div className="py-12"><LoadingSpinner /></div>
              : slots.length === 0 ? <EmptyState title={t.mentorsTab.noMentors} description={t.mentorsTab.allSlotsBusy} />
              : (
                <div className="space-y-2">
                  {slots.map(slot => {
                    const dt = new Date(slot.startDatetime)
                    const isSel = selected?.id === slot.id
                    const isBusy = slot.request?.status === 'pending' || slot.request?.status === 'accepted'
                    return (
                      <div key={slot.id} className={`rounded-xl border-2 p-3 transition-all ${isSel ? 'border-primary bg-primary/5' : isBusy ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 opacity-60' : 'border-border hover:border-primary/40'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-sm">{fmtTime(dt)}</p>
                            <p className="text-xs text-muted-foreground">{slot.durationMinute} {t.mentorsTab.minutes}</p>
                          </div>
                          {isBusy
                            ? <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${slot.request?.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{slot.request?.status === 'accepted' ? `✓ ${t.mentorsTab.slotBusy}` : `⏳ ${t.mentor.pending}`}</span>
                            : <button onClick={() => setSelected(isSel ? null : slot)} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80 transition-colors">{isSel ? t.actions.close : t.actions.select}</button>}
                        </div>
                        {isSel && !isBusy && (
                          <div className="mt-3 pt-3 border-t border-border space-y-2.5">
                            <textarea placeholder={t.mentorsTab.helpDescriptionPlaceholder} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" rows={3} value={message} onChange={e => setMessage(e.target.value)} />
                            <button onClick={() => setConfirmOpen(true)} className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                              {t.actions.send}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
          </div>
        </div>
      </div>
      <ConfirmDialog open={confirmOpen} title={t.actions.send}
        message={t.mentorsTab.sendRequestConfirm.replace('{time}', fmtTime(new Date(selected?.startDatetime || Date.now()))).replace('{duration}', selected?.durationMinute)}
        confirmLabel={t.actions.send} cancelLabel={t.actions.back} danger={false}
        onConfirm={() => { requestMut.mutate({ startDatetime: selected.startDatetime, duration: selected.durationMinute, message }); setConfirmOpen(false) }}
        onCancel={() => setConfirmOpen(false)} />
    </>
  )
}
