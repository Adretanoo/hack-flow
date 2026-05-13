import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Video, X, Lock, CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { mentorshipApi } from '@/api/mentorship'
import { Avatar } from '@/components/shared/Avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Hackathon, Team } from '@/types/api.types'

const UK_DAYS_SHORT = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб']
const UK_MONTHS_SHORT = ['січ','лют','бер','кві','тра','чер','лип','сер','вер','жов','лис','гру']

function fmtTime(dt: Date) { return dt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) }
function isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString() }

interface MentorsTabProps { hackathon: Hackathon; myTeam?: Team; stageInfo: any }

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  pending:   { label: 'Очікує',      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',  dot: 'bg-amber-400' },
  accepted:  { label: 'Заплановано', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',     dot: 'bg-blue-500' },
  completed: { label: 'Завершено',   cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', dot: 'bg-green-500' },
}

export function MentorsTab({ hackathon, myTeam, stageInfo }: MentorsTabProps) {
  const qc = useQueryClient()
  const [selectedMentor, setSelectedMentor] = useState<any>(null)
  const [calOffset, setCalOffset] = useState(0)
  const TODAY = useMemo(() => new Date(), [])

  // 7-day window starting from today + offset
  const calDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(TODAY)
      d.setDate(TODAY.getDate() + calOffset * 7 + i)
      d.setHours(0,0,0,0)
      return d
    })
  }, [TODAY, calOffset])

  const { data: mentorsData, isLoading } = useQuery({
    queryKey: ['mentors', hackathon.id],
    queryFn: () => mentorshipApi.getAvailableMentors({ hackathonId: hackathon.id }),
    enabled: stageInfo.canBookMentor,
  })
  const { data: myBookingsData } = useQuery({
    queryKey: ['my-bookings', myTeam?.id],
    queryFn: () => mentorshipApi.getMyRequests(myTeam!.id),
    enabled: !!myTeam?.id && stageInfo.canBookMentor,
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => mentorshipApi.cancelRequest(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-bookings'] }); qc.invalidateQueries({ queryKey: ['mentor-slots'] }) },
  })

  if (!stageInfo.canBookMentor) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center gap-4">
        <Lock className="h-12 w-12 text-muted-foreground/30" />
        <div><h3 className="text-xl font-semibold mb-1">Бронювання менторів недоступне</h3>
          <p className="text-muted-foreground text-sm max-w-md">Сесії з менторами можна забронювати лише під час етапу розробки (Hacking).</p></div>
      </div>
    )
  }
  if (!myTeam) return <div className="py-24 text-center text-muted-foreground">Спершу створіть або приєднайтесь до команди</div>

  const mentors: any[] = mentorsData?.data?.data || []
  const myBookings: any[] = myBookingsData?.data?.data || []

  // Build calendar data: for each (mentorId, date), list free slot times
  const mentorDaySlots = useMemo(() => {
    // mentors: array of availability objects (one mentor may have multiple)
    // Group by mentor user id
    const byMentor = new Map<string, { mentor: any; avails: any[] }>()
    for (const av of mentors) {
      const mid = av.mentor?.id || av.mentorId
      if (!byMentor.has(mid)) byMentor.set(mid, { mentor: av.mentor, avails: [] })
      byMentor.get(mid)!.avails.push(av)
    }

    return Array.from(byMentor.values()).map(({ mentor, avails }) => {
      const days = calDays.map(day => {
        const slots: { avail: any; time: string; dt: Date }[] = []
        for (const av of avails) {
          if (!isSameDay(new Date(av.startDatetime), day)) continue
          const start = new Date(av.startDatetime)
          const end = new Date(av.endDatetime)
          const dur = av.slotDuration || 30
          const bookedTimes = (av.slots || []).filter((s: any) => s.status === 'pending' || s.status === 'accepted').map((s: any) => new Date(s.startDatetime).getTime())
          let cur = new Date(start)
          while (cur < end) {
            if (!bookedTimes.some((t: number) => Math.abs(t - cur.getTime()) < 60000)) {
              slots.push({ avail: av, time: fmtTime(cur), dt: new Date(cur) })
            }
            cur = new Date(cur.getTime() + dur * 60000)
          }
        }
        return slots
      })
      return { mentor, avails, days }
    })
  }, [mentors, calDays])

  const hasAnythingInWindow = mentorDaySlots.some(m => m.days.some(d => d.length > 0))

  return (
    <div className="mt-6 space-y-8">

      {/* ── My Bookings ── */}
      {myBookings.length > 0 && (
        <section>
          <h3 className="text-base font-bold mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Мої бронювання</h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold text-left">Ментор</th>
                  <th className="px-4 py-3 font-semibold text-left">Дата і час</th>
                  <th className="px-4 py-3 font-semibold text-left">Тривалість</th>
                  <th className="px-4 py-3 font-semibold text-left">Статус</th>
                  <th className="px-4 py-3 font-semibold text-right">Дія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myBookings.map((b: any) => {
                  const meta = STATUS_META[b.status]
                  return (
                    <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-semibold">{b.mentorAvailability?.user?.fullName || b.mentorAvailability?.mentor?.fullName || 'Ментор'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(b.startDatetime).toLocaleString('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{b.durationMinute} хв</td>
                      <td className="px-4 py-3">
                        {meta ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />{meta.label}
                          </span>
                        ) : <span className="text-xs text-destructive font-medium">Скасовано</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.status === 'accepted' && b.meetingLink && (
                            <a href={b.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors">
                              <Video className="h-3.5 w-3.5" />Приєднатись
                            </a>
                          )}
                          {(b.status === 'accepted' || b.status === 'pending') && (
                            <button onClick={() => { if (confirm('Скасувати сесію?')) cancelMut.mutate(b.id) }} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
                              Скасувати
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Mentor Calendar Table ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />Доступні ментори</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setCalOffset(o => o - 1)} className="p-1.5 rounded-lg border border-border hover:bg-accent transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-xs font-semibold text-muted-foreground min-w-[160px] text-center">
              {calDays[0].getDate()} {UK_MONTHS_SHORT[calDays[0].getMonth()]} – {calDays[6].getDate()} {UK_MONTHS_SHORT[calDays[6].getMonth()]}
            </span>
            <button onClick={() => setCalOffset(o => o + 1)} className="p-1.5 rounded-lg border border-border hover:bg-accent transition-colors"><ChevronRight className="h-4 w-4" /></button>
            {calOffset !== 0 && <button onClick={() => setCalOffset(0)} className="text-xs text-primary hover:underline ml-1">Сьогодні</button>}
          </div>
        </div>

        {isLoading ? <div className="py-12"><LoadingSpinner /></div>
          : mentors.length === 0 ? <EmptyState title="Немає доступних менторів" description="Зараз немає менторів з відкритими слотами" />
          : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide w-48">Ментор</th>
                      {calDays.map(d => {
                        const isToday = isSameDay(d, TODAY)
                        return (
                          <th key={d.toDateString()} className={`px-2 py-3 text-center font-semibold text-xs uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                            <span className={`inline-flex flex-col items-center ${isToday ? 'bg-primary text-primary-foreground rounded-lg px-2 py-1' : ''}`}>
                              <span className="text-[10px]">{UK_DAYS_SHORT[d.getDay()]}</span>
                              <span className="text-sm font-bold">{d.getDate()}</span>
                            </span>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mentorDaySlots.map(({ mentor, avails, days }, ri) => (
                      <tr key={mentor?.id || ri} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={mentor?.fullName || 'M'} url={mentor?.avatarUrl} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold text-xs truncate">{mentor?.fullName || 'Ментор'}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{avails[0]?.track?.name || 'Всі треки'}</p>
                            </div>
                          </div>
                        </td>
                        {days.map((slots, di) => (
                          <td key={di} className="px-2 py-2 text-center align-top">
                            {slots.length === 0 ? (
                              <span className="text-[10px] text-muted-foreground/30">—</span>
                            ) : (
                              <div className="flex flex-col gap-1 items-center">
                                {slots.slice(0, 3).map((s, si) => (
                                  <button key={si} onClick={() => setSelectedMentor(s.avail)} className="w-full px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 text-[10px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors">
                                    {s.time}
                                  </button>
                                ))}
                                {slots.length > 3 && (
                                  <button onClick={() => setSelectedMentor(slots[0].avail)} className="text-[10px] text-primary hover:underline font-semibold">+{slots.length - 3} ще</button>
                                )}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!hasAnythingInWindow && (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <p className="font-medium">Немає доступних слотів на цей тиждень</p>
                  <button onClick={() => setCalOffset(o => o + 1)} className="mt-2 text-primary text-xs hover:underline">Переглянути наступний тиждень →</button>
                </div>
              )}
            </div>
          )}

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-100 border-2 border-teal-300" /><span className="text-xs text-muted-foreground">Вільний слот</span></div>
          <div className="flex items-center gap-1.5"><span className="text-xs text-muted-foreground/50">— = немає слотів</span></div>
        </div>
      </section>

      {/* ── Booking Modal ── */}
      {selectedMentor && (
        <BookingModal mentor={selectedMentor} teamId={myTeam.id} onClose={() => setSelectedMentor(null)}
          onBooked={() => { qc.invalidateQueries({ queryKey: ['my-bookings'] }); setSelectedMentor(null) }} />
      )}
    </div>
  )
}

function BookingModal({ mentor, teamId, onClose, onBooked }: any) {
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [message, setMessage] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['mentor-requests', mentor.id],
    queryFn: () => mentorshipApi.getMentorRequests(mentor.id).then(r => r.data.data),
  })

  const requestMut = useMutation({
    mutationFn: (d: any) => mentorshipApi.createRequest({ mentorAvailabilityId: mentor.id, teamId, startDatetime: d.startDatetime, durationMinute: d.duration, message: d.message }),
    onSuccess: () => onBooked(),
    onError: (e: any) => alert(e.message || 'Помилка надсилання запиту'),
  })

  const requests = data || []
  const start = new Date(mentor.startDatetime)
  const end = new Date(mentor.endDatetime)
  const dur = mentor.slotDuration || 30
  const totalSlots = Math.floor((end.getTime() - start.getTime()) / 60000 / dur)

  const slots: any[] = []
  let cur = new Date(start)
  for (let i = 0; i < totalSlots; i++) {
    const dt = new Date(cur)
    const req = requests.find((r: any) => Math.abs(new Date(r.startDatetime).getTime() - dt.getTime()) < 60000 && r.status !== 'rejected')
    if (!req || req.teamId === teamId) slots.push({ id: `s-${i}`, startDatetime: dt.toISOString(), durationMinute: dur, request: req })
    cur = new Date(cur.getTime() + dur * 60000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
          <div>
            <h3 className="font-bold">{mentor.mentor?.fullName || mentor.user?.fullName}</h3>
            <p className="text-xs text-muted-foreground">{new Date(mentor.startDatetime).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} · {mentor.slotDuration || 30} хв/слот</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {isLoading ? <div className="py-12"><LoadingSpinner /></div>
            : slots.length === 0 ? <EmptyState title="Немає вільних слотів" description="Усі слоти вже зайняті" />
            : (
              <div className="space-y-2">
                {slots.map(slot => {
                  const dt = new Date(slot.startDatetime)
                  const isSelected = selectedSlot?.id === slot.id
                  const isPending = slot.request?.status === 'pending'
                  const isAccepted = slot.request?.status === 'accepted'

                  return (
                    <div key={slot.id} className={`rounded-xl border-2 p-3 transition-all ${isSelected ? 'border-primary bg-primary/5' : isPending || isAccepted ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10' : 'border-border hover:border-primary/40'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{fmtTime(dt)}</p>
                          <p className="text-xs text-muted-foreground">{slot.durationMinute} хв</p>
                        </div>
                        {isPending ? <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">⏳ Очікує</span>
                          : isAccepted ? <span className="text-xs font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">✓ Підтверджено</span>
                          : <button onClick={() => setSelectedSlot(isSelected ? null : slot)} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80 transition-colors">{isSelected ? 'Сховати' : 'Вибрати'}</button>}
                      </div>
                      {isSelected && !isPending && !isAccepted && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2.5">
                          <textarea placeholder="Коротко опишіть, з чим потрібна допомога..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" rows={3} value={message} onChange={e => setMessage(e.target.value)} />
                          <button onClick={() => { if (confirm('Надіслати запит?')) requestMut.mutate({ startDatetime: slot.startDatetime, duration: slot.durationMinute, message }) }} disabled={requestMut.isPending} className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                            {requestMut.isPending ? 'Зачекайте...' : 'Надіслати запит'}
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
  )
}
