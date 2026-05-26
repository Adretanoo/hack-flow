import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, X, Info, CalendarDays } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { mentorshipApi } from '@/api/mentorship'
import { hackathonsApi } from '@/api/hackathons'
import { tracksApi } from '@/api/tracks'
import { AvailabilityCard, AvailDetailPanel } from './MentorCalendarCard'
import { useI18n } from '@/i18n'

function getWeekDates(offset: number): Date[] {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function fmtRange(dates: Date[], lang: string) {
  const f = dates[0], l = dates[6]
  const monthFormat = { month: 'short' } as const
  const fullMonthFormat = { month: 'long' } as const
  if (f.getMonth() === l.getMonth()) {
    const m = f.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', fullMonthFormat)
    return `${f.getDate()}–${l.getDate()} ${m} ${f.getFullYear()}`
  }
  const m1 = f.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', monthFormat)
  const m2 = l.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', monthFormat)
  return `${f.getDate()} ${m1} – ${l.getDate()} ${m2} ${l.getFullYear()}`
}

const LS_KEY = 'mentor_hackathon'
const TODAY = new Date()
const TODAY_STR = TODAY.toISOString().split('T')[0]

export function MentorAvailabilityPage() {
  const qc = useQueryClient()
  const { t, lang } = useI18n()
  const [hackathonId, setHackathonId] = useState(() => localStorage.getItem(LS_KEY) || '')
  const [weekOffset, setWeekOffset] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [selectedAvailId, setSelectedAvailId] = useState<string | null>(null)
  const [formTrackId, setFormTrackId] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formStart, setFormStart] = useState('10:00')
  const [formEnd, setFormEnd] = useState('12:00')
  const [slotDur, setSlotDur] = useState(30)
  const [errs, setErrs] = useState<Record<string, string>>({})

  const changeHackathon = (id: string) => { setHackathonId(id); localStorage.setItem(LS_KEY, id) }

  const { data: hackathonsData } = useQuery({ queryKey: ['mentor-hackathons'], queryFn: () => hackathonsApi.list({ limit: 100 }).then(r => r.data.data) })
  const hackathons: any[] = hackathonsData || []
  const effId = hackathonId || hackathons[0]?.id || ''

  const { data: availsData, isLoading } = useQuery({
    queryKey: ['my-availabilities', hackathonId],
    queryFn: () => mentorshipApi.getMyAvailabilities(hackathonId || undefined).then(r => r.data.data),
    refetchInterval: 10_000,  // poll every 10s — real-time feel without WebSocket
    staleTime: 5_000,
  })
  const { data: tracksData } = useQuery({ queryKey: ['tracks', effId], queryFn: () => tracksApi.list({ hackathon_id: effId, limit: 100 }).then((r: any) => r.data.data), enabled: !!effId })
  const { data: myTracksData } = useQuery({ queryKey: ['my-tracks', effId], queryFn: () => mentorshipApi.getMyTracks(effId).then(r => r.data.data), enabled: !!effId })

  const avails: any[] = availsData || []
  const tracks: any[] = tracksData || []
  const myTracks: any[] = myTracksData || []
  const hasGlobal = myTracks.some((t: any) => !t.track)
  const allowedTracks = hasGlobal || myTracks.length === 0 ? tracks : tracks.filter((t: any) => myTracks.some((mt: any) => mt.track?.id === t.id))

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  const byDate = useMemo(() => {
    const map = new Map<string, any[]>()
    weekDates.forEach(d => map.set(d.toDateString(), []))
    avails.forEach(av => { const k = new Date(av.startDatetime).toDateString(); if (map.has(k)) map.get(k)!.push(av) })
    return map
  }, [avails, weekDates])

  // Always derive fresh selectedAvail from live query data
  const selectedAvail = selectedAvailId ? avails.find(a => a.id === selectedAvailId) ?? null : null

  const preview = useMemo(() => {
    if (!formDate || !formStart || !formEnd) return []
    const s = new Date(`${formDate}T${formStart}:00`), e = new Date(`${formDate}T${formEnd}:00`)
    if (s >= e) return []
    const count = Math.floor((e.getTime() - s.getTime()) / 60000 / slotDur)
    const list: string[] = []
    let cur = new Date(s)
    for (let i = 0; i < Math.min(count, 24); i++) {
      list.push(cur.toLocaleTimeString(lang === 'uk' ? 'uk-UA' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
      cur = new Date(cur.getTime() + slotDur * 60000)
    }
    return list
  }, [formDate, formStart, formEnd, slotDur, lang])

  const createMut = useMutation({
    mutationFn: (data: any) => mentorshipApi.createAvailability(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-availabilities'] }); setFormDate(''); setFormStart('10:00'); setFormEnd('12:00'); setFormTrackId(''); setErrs({}); setShowForm(false) },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || t.states.error
      if (msg.toLowerCase().includes('overlap') || msg.toLowerCase().includes('conflict')) {
        setErrs(p => ({ ...p, range: t.mentor.overlapError }))
      } else {
        setErrs(p => ({ ...p, range: msg }))
      }
    },
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formDate) e.date = t.mentor.selectDateError
    else if (formDate < TODAY_STR) e.date = t.mentor.futureDateOnly
    
    // Check if time is in the past for today
    if (formDate === TODAY_STR) {
      const now = new Date()
      const startTime = new Date(`${formDate}T${formStart}:00`)
      if (startTime < now) {
        e.range = t.mentor.startTimePassed
      }
    }

    if (formEnd <= formStart) e.end = t.mentor.endTimeLater
    if (preview.length === 0 && !e.end) e.range = t.mentor.increaseRange
    setErrs(e); return Object.keys(e).length === 0
  }

  const handleCreate = () => {
    if (!validate()) return
    createMut.mutate({ hackathonId: effId, trackId: formTrackId || undefined, startDatetime: new Date(`${formDate}T${formStart}:00`).toISOString(), endDatetime: new Date(`${formDate}T${formEnd}:00`).toISOString(), slotDuration: slotDur })
  }

  const totalAvails = avails.length
  const totalFree = avails.reduce((sum, av) => {
    const dur = av.slotDuration || 30
    const total = Math.floor((new Date(av.endDatetime).getTime() - new Date(av.startDatetime).getTime()) / 60000 / dur)
    const booked = (av.slots || []).filter((s: any) => s.status === 'pending' || s.status === 'accepted').length
    return sum + Math.max(0, total - booked)
  }, 0)

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader title={t.mentor.mySchedule} subtitle={t.mentor.calendarSubtitle} />
        <div className="flex items-center gap-3 flex-wrap">
          {hackathons.length > 1 && (
            <select value={hackathonId} onChange={e => changeHackathon(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm">
              <option value="">{t.mentor.allHackathonsSelector}</option>
              {hackathons.map((h: any) => <option key={h.id} value={h.id}>{h.title}</option>)}
            </select>
          )}
          {hackathons.length === 1 && <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{hackathons[0].title}</span>}
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> {t.mentor.createSlot}
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: t.mentor.statsAvailBlocks, value: totalAvails, color: 'text-primary' },
          { label: t.mentor.statsFreeSlots, value: totalFree, color: 'text-teal-600' },
          { label: t.mentor.statsThisWeek, value: weekDates.reduce((s, d) => s + (byDate.get(d.toDateString())?.length || 0), 0), color: 'text-blue-600' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Info banner ── */}
      <div className="rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-3 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800 dark:text-blue-300">{t.mentor.availabilityHint}</p>
      </div>

      <div className="flex gap-5 items-start">
        {/* ── CALENDAR ── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Week nav */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg hover:bg-accent transition-colors"><ChevronLeft className="h-5 w-5" /></button>
            <div className="flex-1 text-center">
              <p className="font-semibold text-sm"><CalendarDays className="h-4 w-4 inline mr-1.5 text-primary" />{fmtRange(weekDates, lang)}</p>
              {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline">{t.mentor.todayNav}</button>}
            </div>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg hover:bg-accent transition-colors"><ChevronRight className="h-5 w-5" /></button>
          </div>

          {isLoading ? <div className="py-16"><LoadingSpinner /></div> : (
            <div className="overflow-x-auto pb-2 -mx-1 px-1">
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', minWidth: '910px' }}>
              {weekDates.map(date => {
                const dayAvails = byDate.get(date.toDateString()) || []
                const isToday = isSameDay(date, TODAY)
                const isPast = date < TODAY && !isToday
                return (
                  <div key={date.toDateString()} className="flex flex-col gap-1.5 min-w-0">
                    {/* Day header */}
                    <div className={`rounded-xl p-2 text-center transition-all ${isToday ? 'bg-primary shadow-md shadow-primary/20' : 'bg-card border border-border'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-widest ${isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {date.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { weekday: 'short' })}
                      </p>
                      <p className={`text-base font-bold leading-tight ${isToday ? 'text-primary-foreground' : isPast ? 'text-muted-foreground/40' : ''}`}>{date.getDate()}</p>
                      <p className={`text-[9px] ${isToday ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}>
                        {date.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { month: 'short' })}
                      </p>
                    </div>

                    {dayAvails.length === 0 ? (
                      <div className={`flex-1 rounded-xl border-2 border-dashed min-h-[90px] flex items-center justify-center transition-all ${isPast ? 'border-border/20 opacity-40' : 'border-border/40 hover:border-primary/20 hover:bg-primary/[0.02]'}`}>
                        <span className="text-[9px] text-muted-foreground/30 text-center leading-tight hidden md:block">{!isPast ? t.states.noData : ''}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {dayAvails.map(av => <AvailabilityCard key={av.id} avail={av} onSelect={a => setSelectedAvailId(a.id)} />)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 px-2 pt-1">
            {[
              { color: 'bg-teal-100 border-teal-300', label: t.mentor.legendFree },
              { color: 'bg-amber-100 border-amber-300', label: t.mentor.legendPending },
              { color: 'bg-blue-100 border-blue-300', label: t.mentor.legendConfirmed },
              { color: 'bg-muted border-border', label: t.mentor.legendBlocked },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded border-2 ${l.color}`} />
                <span className="text-xs text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ADD FORM PANEL ── */}
        {showForm && (
          <div className="w-80 shrink-0 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
              <h3 className="font-semibold text-sm">{t.mentor.addAvailabilityTitle}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Show track selector only when mentor has multiple specific tracks */}
              {!hasGlobal && allowedTracks.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">{t.adminTeams.track}</label>
                  <select value={formTrackId} onChange={e => setFormTrackId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
                    <option value="">{t.mentor.allTracks}</option>
                    {allowedTracks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">{t.mentor.slotDate}</label>
                <input type="date" value={formDate} min={TODAY_STR} onChange={e => { setFormDate(e.target.value); setErrs(p => ({ ...p, date: '' })) }} className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-primary bg-background ${errs.date ? 'border-destructive' : 'border-border'}`} />
                {errs.date && <p className="text-xs text-destructive mt-1">{errs.date}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">{t.mentor.startTime}</label>
                  <input type="time" step="900" value={formStart} onChange={e => { setFormStart(e.target.value); setErrs(p => ({ ...p, end: '', range: '' })) }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">{t.mentor.endTime}</label>
                  <input type="time" step="900" value={formEnd} onChange={e => { setFormEnd(e.target.value); setErrs(p => ({ ...p, end: '', range: '' })) }} className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-primary bg-background ${errs.end ? 'border-destructive' : 'border-border'}`} />
                  {errs.end && <p className="text-xs text-destructive mt-1">{errs.end}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{t.mentor.slotDuration}</label>
                <div className="flex gap-1.5">
                  {[15, 30, 45, 60].map(d => (
                    <button key={d} type="button" onClick={() => setSlotDur(d)} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${slotDur === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>{d}{t.mentorsTab.minutes}</button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className={`rounded-lg border p-3 ${errs.range ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/20'}`}>
                {preview.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center">{errs.range || t.mentor.selectDateTime}</p>
                ) : (
                  <>
                    <p className="text-xs font-bold text-teal-700 dark:text-teal-400 mb-2">{t.mentor.slotsOf(preview.length, slotDur)}</p>
                    <div className="flex flex-wrap gap-1">
                      {preview.map((timeText, idx) => <span key={idx} className="px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30 text-[10px] font-mono font-bold">{timeText}</span>)}
                    </div>
                  </>
                )}
                {errs.range && <p className="text-xs text-destructive mt-1">{errs.range}</p>}
              </div>

              <button onClick={handleCreate} disabled={preview.length === 0 || createMut.isPending} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {createMut.isPending ? t.states.loading : t.mentor.addToScheduleBtn}
              </button>
            </div>
          </div>
        )}
      </div>
      {selectedAvail && (
        <AvailDetailPanel avail={selectedAvail} onClose={() => setSelectedAvailId(null)} />
      )}
    </div>
  )
}
