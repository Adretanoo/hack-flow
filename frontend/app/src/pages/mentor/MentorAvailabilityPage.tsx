import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Trash2, ChevronDown, ChevronUp, AlertTriangle, CalendarDays } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { mentorshipApi } from '@/api/mentorship'
import { hackathonsApi } from '@/api/hackathons'
import { tracksApi } from '@/api/tracks'

const LS_KEY = 'mentor_hackathon'
const TODAY = new Date().toISOString().split('T')[0]

const UK_DAYS = ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота']
const UK_MONTHS = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']

function fmtDay(dt: Date) { return `${UK_DAYS[dt.getDay()]}, ${dt.getDate()} ${UK_MONTHS[dt.getMonth()]}` }
function fmtTime(dt: Date) { return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

export function MentorAvailabilityPage() {
  const qc = useQueryClient()
  const [hackathonId, setHackathonId] = useState(() => localStorage.getItem(LS_KEY) || '')

  // Form state
  const [formTrackId, setFormTrackId] = useState('')
  const [formDate, setFormDate]       = useState('')
  const [formStart, setFormStart]     = useState('10:00')
  const [formEnd, setFormEnd]         = useState('12:00')
  const [slotDuration, setSlotDuration] = useState(30)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const changeHackathon = (id: string) => { setHackathonId(id); localStorage.setItem(LS_KEY, id) }

  const { data: hackathonsData } = useQuery({
    queryKey: ['mentor-hackathons'],
    queryFn: () => hackathonsApi.list({ limit: 100 }).then(r => r.data.data),
  })
  const hackathons: any[] = hackathonsData || []
  const effectiveHackathonId = hackathonId || hackathons[0]?.id || ''

  const { data: availabilitiesData, isLoading } = useQuery({
    queryKey: ['my-availabilities', hackathonId],
    queryFn: () => mentorshipApi.getMyAvailabilities(hackathonId || undefined).then(r => r.data.data),
  })

  const { data: tracksData } = useQuery({
    queryKey: ['tracks', effectiveHackathonId],
    queryFn: () => tracksApi.list({ hackathon_id: effectiveHackathonId, limit: 100 }).then((r: any) => r.data.data),
    enabled: !!effectiveHackathonId,
  })
  const tracks: any[] = tracksData || []
  const availabilities: any[] = availabilitiesData || []

  // Live preview
  const { slots: previewSlots, remainder } = useMemo(() => {
    if (!formDate || !formStart || !formEnd) return { slots: [], remainder: 0 }
    const s = new Date(`${formDate}T${formStart}:00`)
    const e = new Date(`${formDate}T${formEnd}:00`)
    if (s >= e) return { slots: [], remainder: 0 }
    const diffMins = (e.getTime() - s.getTime()) / 60000
    const count = Math.floor(diffMins / slotDuration)
    const rem   = diffMins % slotDuration
    const list: string[] = []
    let cur = new Date(s)
    for (let i = 0; i < Math.min(count, 24); i++) {
      list.push(fmtTime(cur))
      cur = new Date(cur.getTime() + slotDuration * 60000)
    }
    return { slots: list, remainder: rem }
  }, [formDate, formStart, formEnd, slotDuration])

  const createMut = useMutation({
    mutationFn: (data: any) => mentorshipApi.createAvailability(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-availabilities'] })
      setFormDate(''); setFormStart('10:00'); setFormEnd('12:00'); setFormTrackId('')
      setFormErrors({})
    },
    onError: (err: any) => alert(err.message || 'Помилка'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => mentorshipApi.deleteAvailability(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-availabilities'] }),
    onError: (err: any) => alert(err.message || 'Помилка'),
  })

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formDate) { errs.date = 'Оберіть дату' }
    else if (formDate < TODAY) { errs.date = 'Оберіть майбутню дату' }
    if (formEnd <= formStart) { errs.end = 'Час закінчення має бути пізніше початку' }
    if (previewSlots.length === 0) { errs.range = 'Збільшіть діапазон або зменшіть тривалість слоту' }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreate = () => {
    if (!validate()) return
    const s = new Date(`${formDate}T${formStart}:00`)
    const e = new Date(`${formDate}T${formEnd}:00`)
    createMut.mutate({ hackathonId: effectiveHackathonId, trackId: formTrackId || undefined, startDatetime: s.toISOString(), endDatetime: e.toISOString(), slotDuration })
  }

  // Group availabilities by date
  const byDate = useMemo(() => {
    const map = new Map<string, any[]>()
    availabilities.sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()).forEach(av => {
      const key = new Date(av.startDatetime).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(av)
    })
    return map
  }, [availabilities])

  return (
    <div className="space-y-5 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader title="Мій розклад" subtitle="Керування слотами для менторства" />
        {hackathons.length > 1 ? (
          <select value={hackathonId} onChange={e => changeHackathon(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm min-w-[180px] shrink-0">
            <option value="">Всі хакатони</option>
            {hackathons.map((h: any) => <option key={h.id} value={h.id}>{h.title}</option>)}
          </select>
        ) : hackathons.length === 1 ? (
          <span className="shrink-0 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{hackathons[0].title}</span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* ── LEFT: Existing availabilities ── */}
        <div className="space-y-4 min-w-0">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Існуючі доступності
          </h3>

          {isLoading ? <div className="py-12"><LoadingSpinner /></div>
           : availabilities.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center space-y-3">
              <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="font-semibold text-muted-foreground">Ви ще не додали жодного часового блоку</p>
              <p className="text-sm text-muted-foreground">↗ Заповніть форму праворуч</p>
            </div>
           ) : (
            <div className="space-y-4">
              {Array.from(byDate.entries()).map(([dateKey, avs]) => (
                <div key={dateKey}>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">{fmtDay(new Date(avs[0].startDatetime))}</p>
                  <div className="space-y-2">
                    {avs.map((avail: any) => {
                      const start = new Date(avail.startDatetime)
                      const end   = new Date(avail.endDatetime)
                      const dur   = avail.slotDuration || 30
                      const totalSlots = Math.floor((end.getTime() - start.getTime()) / 60000 / dur)
                      const slots: any[] = avail.slots || []
                      const bookedSlots = slots.filter((s: any) => s.status !== 'cancelled')
                      const bookedCount = bookedSlots.length
                      const freeCount   = Math.max(0, totalSlots - bookedCount)
                      const isExpanded  = expandedRows[avail.id]
                      const canDelete   = bookedCount === 0

                      // Build full slot grid for expanded view
                      const slotGrid: { time: string; slot?: any }[] = []
                      let cur = new Date(start)
                      for (let i = 0; i < totalSlots; i++) {
                        const slotTime = new Date(cur)
                        const matchSlot = bookedSlots.find((s: any) => Math.abs(new Date(s.startDatetime).getTime() - slotTime.getTime()) < 60000)
                        slotGrid.push({ time: fmtTime(slotTime), slot: matchSlot })
                        cur = new Date(cur.getTime() + dur * 60000)
                      }

                      return (
                        <div key={avail.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                          <div className="p-4 flex items-center gap-3">
                            <button onClick={() => setExpandedRows(p => ({ ...p, [avail.id]: !p[avail.id] }))} className="flex-1 text-left flex items-center gap-3 hover:text-primary transition-colors">
                              {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                              <div>
                                <p className="font-semibold">{fmtTime(start)} – {fmtTime(end)}</p>
                                <p className="text-xs text-muted-foreground">Трек: {avail.track?.name || 'Всі треки'} · {dur} хв/слот</p>
                              </div>
                            </button>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">● {bookedCount} заброньовано</span>
                              <span className="px-2 py-1 bg-muted text-muted-foreground rounded font-medium">○ {freeCount} вільних</span>
                            </div>
                            <button
                              onClick={() => { if (canDelete && confirm('Видалити цей часовий блок?')) deleteMut.mutate(avail.id) }}
                              disabled={!canDelete || deleteMut.isPending}
                              title={canDelete ? 'Видалити' : 'Неможливо видалити — є активні бронювання'}
                              className="p-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-border bg-muted/10 p-4">
                              <div className="space-y-1.5">
                                {slotGrid.map(({ time, slot }, i) => (
                                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${slot ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-background border border-border'}`}>
                                    <span className="font-mono font-semibold w-12 shrink-0">{time}</span>
                                    {slot ? (
                                      <>
                                        <span className="flex-1 font-medium truncate">{slot.team?.name || 'Команда'}</span>
                                        {slot.meetingLink && (
                                          <a href={slot.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-primary underline shrink-0">Приєднатись</a>
                                        )}
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">✅ Заброньовано</span>
                                      </>
                                    ) : (
                                      <span className="flex-1 text-muted-foreground">— Вільний</span>
                                    )}
                                  </div>
                                ))}
                              </div>
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
        </div>

        {/* ── RIGHT: Add form (always visible) ── */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-5">
            <h3 className="text-lg font-semibold border-b border-border pb-3">Додати доступність</h3>

            {/* Track */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Трек</label>
              <select value={formTrackId} onChange={e => setFormTrackId(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none">
                <option value="">🌐 Всі треки</option>
                {tracks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Залиште «Всі треки» якщо готові допомагати будь-якій команді</p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Дата</label>
              <input type="date" value={formDate} min={TODAY} onChange={e => { setFormDate(e.target.value); setFormErrors(p => ({ ...p, date: '' })) }} className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-background ${formErrors.date ? 'border-destructive' : 'border-border'}`} />
              {formErrors.date && <p className="text-xs text-destructive mt-1">{formErrors.date}</p>}
            </div>

            {/* Start / End */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Початок</label>
                <input type="time" step="900" value={formStart} onChange={e => { setFormStart(e.target.value); setFormErrors(p => ({ ...p, end: '', range: '' })) }} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Кінець</label>
                <input type="time" step="900" value={formEnd} onChange={e => { setFormEnd(e.target.value); setFormErrors(p => ({ ...p, end: '', range: '' })) }} className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-background ${formErrors.end ? 'border-destructive' : 'border-border'}`} />
                {formErrors.end && <p className="text-xs text-destructive mt-1">{formErrors.end}</p>}
              </div>
            </div>

            {/* Slot duration — toggle buttons */}
            <div>
              <label className="block text-sm font-medium mb-2">Тривалість слоту</label>
              <div className="flex gap-2">
                {[15, 30, 45, 60].map(d => (
                  <button key={d} type="button" onClick={() => setSlotDuration(d)} className={`flex-1 py-2 rounded-md text-sm font-semibold border-2 transition-all ${slotDuration === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {d} хв
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div className={`rounded-lg border p-4 space-y-3 ${formErrors.range ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/20'}`}>
              {previewSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">{formErrors.range || 'Оберіть дату та час для попереднього перегляду'}</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                    📅 Буде створено {previewSlots.length} слотів по {slotDuration} хв
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewSlots.map((t, i) => (
                      <span key={i} className="px-2 py-1 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30 text-xs font-mono font-semibold">{t}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Загальний час: {Math.floor(previewSlots.length * slotDuration / 60) > 0 ? `${Math.floor(previewSlots.length * slotDuration / 60)} год ` : ''}{(previewSlots.length * slotDuration) % 60 > 0 ? `${(previewSlots.length * slotDuration) % 60} хв` : ''}
                  </p>
                  {remainder > 0 && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Залишок {remainder} хв не вміщує повний слот і буде пропущено
                    </div>
                  )}
                </>
              )}
            </div>

            <button onClick={handleCreate} disabled={previewSlots.length === 0 || createMut.isPending} className="w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {createMut.isPending ? 'Збереження...' : 'Додати до розкладу'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
