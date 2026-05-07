import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar as CalendarIcon, Video, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { mentorshipApi } from '@/api/mentorship'

export function MentorSlotsPage() {
  const queryClient = useQueryClient()
  
  // Fetch My Availabilities (which include slots)
  const { data: availabilitiesData, isLoading } = useQuery({
    queryKey: ['my-availabilities'],
    queryFn: () => mentorshipApi.getMyAvailabilities().then(res => res.data.data)
  })

  // State
  const [filterStatus, setFilterStatus] = useState<string>('all') // all, booked, completed, cancelled
  
  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    return new Date(d.setDate(diff))
  })

  const shiftWeek = (dir: number) => {
    setCurrentWeekStart(prev => new Date(prev.getTime() + dir * 7 * 24 * 60 * 60 * 1000))
  }

  const goToday = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    setCurrentWeekStart(new Date(d.setDate(diff)))
  }

  // Mutations
  const completeMut = useMutation({
    mutationFn: (slotId: string) => mentorshipApi.completeBooking(slotId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-availabilities'] })
  })

  // Extract all slots and flatten
  const allSlots = useMemo(() => {
    if (!availabilitiesData) return []
    const slots: any[] = []
    availabilitiesData.forEach((avail: any) => {
      if (avail.slots) {
        avail.slots.forEach((s: any) => {
          slots.push({ ...s, trackName: avail.track?.name || 'Всі треки' })
        })
      }
    })
    return slots.sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
  }, [availabilitiesData])

  // Stats
  const totalBooked = allSlots.length
  const completed = allSlots.filter(s => s.status === 'completed').length
  const pending = allSlots.filter(s => s.status === 'booked').length
  
  // Calculate free slots from availabilities (approximation based on duration)
  let totalFree = 0
  if (availabilitiesData) {
    availabilitiesData.forEach((avail: any) => {
      const s = new Date(avail.startDatetime)
      const e = new Date(avail.endDatetime)
      const dur = avail.slotDuration || 30
      const possible = Math.floor((e.getTime() - s.getTime()) / 60000 / dur)
      const active = (avail.slots || []).filter((sl: any) => sl.status !== 'cancelled').length
      totalFree += Math.max(0, possible - active)
    })
  }

  // Today banner logic
  const now = new Date()
  const todayStr = now.toDateString()
  const todaysSlots = allSlots.filter(s => new Date(s.startDatetime).toDateString() === todayStr && s.status === 'booked')
  const nextSlot = todaysSlots.find(s => new Date(s.startDatetime).getTime() > now.getTime())

  // Filter slots for current week calendar
  const filteredSlots = allSlots.filter(s => filterStatus === 'all' || s.status === filterStatus)
  const weekEnd = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
  weekEnd.setHours(23, 59, 59, 999)

  const slotsThisWeek = filteredSlots.filter(s => {
    const d = new Date(s.startDatetime)
    return d >= currentWeekStart && d <= weekEnd
  })

  // Group by day of week (0 = Mon, 6 = Sun)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const slotsByDay = days.map(d => {
    return slotsThisWeek.filter(s => new Date(s.startDatetime).toDateString() === d.toDateString())
  })

  if (isLoading) return <div className="py-24"><LoadingSpinner /></div>

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader title="Мої слоти" subtitle="Управління заброньованими сесіями" />

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground">Всього сесій</p><p className="text-2xl font-bold">{totalBooked}</p></div>
          <CalendarIcon className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground">Завершено</p><p className="text-2xl font-bold text-green-600">{completed}</p></div>
          <CheckCircle className="h-8 w-8 text-green-600/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground">Очікує</p><p className="text-2xl font-bold text-blue-600">{pending}</p></div>
          <Clock className="h-8 w-8 text-blue-600/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between bg-primary/5">
          <div><p className="text-sm font-medium text-primary">Вільних слотів</p><p className="text-2xl font-bold text-primary">{totalFree}</p></div>
          <CalendarIcon className="h-8 w-8 text-primary/30" />
        </div>
      </div>

      {/* Today Banner */}
      {todaysSlots.length > 0 && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Сьогодні у вас {todaysSlots.length} сесій</h3>
              <p className="text-sm text-blue-800/80 dark:text-blue-200">
                {nextSlot 
                  ? `Наступна сесія розпочнеться о ${new Date(nextSlot.startDatetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                  : 'Всі сесії на сьогодні вже розпочались або завершились'}
              </p>
            </div>
          </div>
          {nextSlot && nextSlot.meetingLink && (
            <a 
              href={nextSlot.meetingLink} 
              target="_blank" 
              rel="noreferrer"
              className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Video className="h-4 w-4" /> Приєднатись до наступної
            </a>
          )}
        </div>
      )}

      {/* Calendar Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => shiftWeek(-1)} className="p-2 rounded-md hover:bg-muted text-muted-foreground"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-muted">Сьогодні</button>
            <button onClick={() => shiftWeek(1)} className="p-2 rounded-md hover:bg-muted text-muted-foreground"><ChevronRight className="h-5 w-5" /></button>
            <span className="font-semibold ml-2">
              {currentWeekStart.toLocaleDateString([], { month: 'short', day: 'numeric' })} — {weekEnd.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center bg-muted/50 p-1 rounded-lg">
            {[
              { id: 'all', label: 'Всі' },
              { id: 'booked', label: 'Очікують' },
              { id: 'completed', label: 'Завершені' },
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${filterStatus === f.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-border">
          {days.map((day, idx) => {
            const daySlots = slotsByDay[idx]
            const isToday = day.toDateString() === now.toDateString()
            return (
              <div key={idx} className={`min-h-[300px] flex flex-col ${isToday ? 'bg-primary/5' : ''}`}>
                <div className={`p-3 text-center border-b border-border ${isToday ? 'font-bold text-primary border-primary/20' : 'text-muted-foreground'}`}>
                  <p className="text-xs uppercase tracking-wider">{day.toLocaleDateString('uk-UA', { weekday: 'short' })}</p>
                  <p className="text-lg">{day.getDate()}</p>
                </div>
                
                <div className="p-2 flex-1 space-y-2 overflow-y-auto">
                  {daySlots.length === 0 ? (
                    <p className="text-xs text-center text-muted-foreground/50 py-4 font-medium">Немає сесій</p>
                  ) : (
                    daySlots.map((slot: any) => {
                      const st = new Date(slot.startDatetime)
                      const isCompleted = slot.status === 'completed'
                      const isCancelled = slot.status === 'cancelled'
                      const isUpcoming = slot.status === 'booked' && st.getTime() - now.getTime() < 30 * 60000 && st.getTime() > now.getTime()

                      return (
                        <div 
                          key={slot.id} 
                          className={`p-2.5 rounded-lg border text-xs relative group transition-all
                            ${isCompleted ? 'bg-muted/30 border-border opacity-70' : 
                              isCancelled ? 'bg-destructive/5 border-destructive/20 text-destructive' : 
                              'bg-background border-primary/30 shadow-sm hover:border-primary'}
                          `}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-[13px]">
                              {st.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </span>
                            {isCompleted && <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                            {isCancelled && <XCircle className="h-3.5 w-3.5" />}
                          </div>
                          
                          <p className={`font-semibold mb-0.5 truncate ${isCancelled ? '' : 'text-foreground'}`} title={slot.team?.name}>
                            {slot.team?.name || 'Невідома команда'}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate mb-2">{slot.trackName}</p>

                          {!isCompleted && !isCancelled && (
                            <div className="flex flex-col gap-1.5 mt-2">
                              {slot.meetingLink && (
                                <a 
                                  href={slot.meetingLink} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className={`w-full py-1.5 rounded-md flex justify-center items-center gap-1.5 font-medium transition-colors
                                    ${isUpcoming ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-primary/10 text-primary hover:bg-primary/20'}
                                  `}
                                >
                                  <Video className="h-3.5 w-3.5" /> Лінк
                                </a>
                              )}
                              <button 
                                onClick={() => completeMut.mutate(slot.id)}
                                disabled={completeMut.isPending}
                                className="w-full py-1.5 rounded-md bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-800 transition-colors font-medium border border-border"
                              >
                                Завершити
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
