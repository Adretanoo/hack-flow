import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { mentorshipApi } from '@/api/mentorship'
import { hackathonsApi } from '@/api/hackathons'
import { tracksApi } from '@/api/tracks'

export function MentorAvailabilityPage() {
  const queryClient = useQueryClient()
  const [activeHackathonId, setActiveHackathonId] = useState<string>('')
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [formTrackId, setFormTrackId] = useState<string>('')
  const [formDate, setFormDate] = useState<string>('')
  const [formStart, setFormStart] = useState<string>('10:00')
  const [formEnd, setFormEnd] = useState<string>('12:00')
  const [slotDuration, setSlotDuration] = useState<number>(30)

  // Fetch Hackathons
  const { data: hackathonsData } = useQuery({
    queryKey: ['mentor-hackathons'],
    queryFn: () => hackathonsApi.list({ limit: 100 }).then(res => res.data.data) // Assuming it's an array based on prev fixes
  })

  // We should auto-select first hackathon if activeHackathonId is empty
  // Wait, let's just let it be empty meaning "All" for list, but for Form we need to require one if there are multiple.
  
  // Fetch My Availabilities
  const { data: availabilitiesData, isLoading } = useQuery({
    queryKey: ['my-availabilities', activeHackathonId],
    queryFn: () => mentorshipApi.getMyAvailabilities(activeHackathonId || undefined).then(res => res.data.data)
  })

  // Fetch Tracks (for the selected hackathon in form)
  const formHackathonId = activeHackathonId || (hackathonsData && hackathonsData.length > 0 ? (hackathonsData[0] as any).id : '')
  const { data: tracksData } = useQuery({
    queryKey: ['tracks', formHackathonId],
    queryFn: () => tracksApi.list({ hackathon_id: formHackathonId, limit: 100 }).then((res: any) => res.data.data),
    enabled: !!formHackathonId
  })

  const availabilities = availabilitiesData || []
  const hackathons = hackathonsData || []
  const tracks = tracksData || []

  // Mutations
  const createMut = useMutation({
    mutationFn: (data: any) => mentorshipApi.createAvailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-availabilities'] })
      setShowForm(false)
      // Reset some form state
      setFormDate('')
      setFormStart('10:00')
      setFormEnd('12:00')
    },
    onError: (err: any) => alert(err.response?.data?.message || err.message)
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => mentorshipApi.deleteAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-availabilities'] })
    },
    onError: (err: any) => alert(err.response?.data?.message || err.message)
  })

  // Expandable rows state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const toggleRow = (id: string) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))

  // Calculate live preview
  let previewSlotsCount = 0
  let previewBlocks: string[] = []
  if (formDate && formStart && formEnd) {
    const sDate = new Date(`${formDate}T${formStart}:00`)
    const eDate = new Date(`${formDate}T${formEnd}:00`)
    if (sDate < eDate) {
      const diffMins = (eDate.getTime() - sDate.getTime()) / 60000
      previewSlotsCount = Math.floor(diffMins / slotDuration)
      
      let curr = new Date(sDate)
      for (let i=0; i<Math.min(previewSlotsCount, 20); i++) { // cap preview at 20 visually
        previewBlocks.push(curr.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
        curr = new Date(curr.getTime() + slotDuration * 60000)
      }
    }
  }

  const handleCreate = () => {
    if (!formDate || !formStart || !formEnd) return alert('Всі поля часу є обов\'язковими')
    const sDate = new Date(`${formDate}T${formStart}:00`)
    const eDate = new Date(`${formDate}T${formEnd}:00`)
    
    if (sDate >= eDate) return alert('Час завершення має бути пізніше за час початку')
    if (sDate < new Date()) return alert('Не можна створити доступність у минулому')
    if (previewSlotsCount < 1) return alert(`Проміжок часу занадто малий для слота тривалістю ${slotDuration} хв`)

    createMut.mutate({
      hackathonId: formHackathonId,
      trackId: formTrackId || undefined,
      startDatetime: sDate.toISOString(),
      endDatetime: eDate.toISOString(),
      slotDuration
    })
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Розклад" subtitle="Керування вашими слотами для менторства" />
        
        {hackathons.length > 0 && (
          <select 
            value={activeHackathonId} 
            onChange={e => setActiveHackathonId(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm"
          >
            <option value="">Всі хакатони</option>
            {hackathons.map((h: any) => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Add Availability Form Inline */}
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 text-primary px-4 py-6 w-full justify-center hover:bg-primary/10 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Додати доступність</span>
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-lg font-semibold">Нова доступність</h3>
            <button onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground">Скасувати</button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Трек (опціонально)</label>
                <select value={formTrackId} onChange={e => setFormTrackId(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Всі треки</option>
                  {tracks.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Оберіть трек, якщо ви спеціалізуєтесь на певній темі</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Дата</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Початок</label>
                  <input type="time" step="900" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Кінець</label>
                  <input type="time" step="900" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Тривалість слота</label>
                <div className="flex gap-4">
                  {[15, 30, 45, 60].map(dur => (
                    <label key={dur} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="slotDuration" checked={slotDuration === dur} onChange={() => setSlotDuration(dur)} className="text-primary focus:ring-primary" />
                      {dur} хв
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-4 border border-border flex flex-col">
              <h4 className="text-sm font-semibold mb-2">Прев'ю розкладу</h4>
              {(!formDate || !formStart || !formEnd) ? (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center">
                  Оберіть дату та час для попереднього перегляду
                </div>
              ) : previewSlotsCount > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Буде створено {previewSlotsCount} слотів по {slotDuration} хвилин
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {previewBlocks.map((time, idx) => (
                      <div key={idx} className="bg-primary/10 text-primary border border-primary/20 rounded px-2 py-1 text-xs font-mono font-medium">
                        {time}
                      </div>
                    ))}
                    {previewSlotsCount > 20 && <div className="text-xs text-muted-foreground px-2 py-1">... та ще {previewSlotsCount - 20}</div>}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-destructive text-center">
                  Некоректний проміжок часу або занадто малий для слота
                </div>
              )}

              <button 
                onClick={handleCreate}
                disabled={previewSlotsCount < 1 || createMut.isPending}
                className="w-full mt-auto rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {createMut.isPending ? 'Збереження...' : 'Підтвердити доступність'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availabilities List */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" /> Мої доступності
        </h3>

        {isLoading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : availabilities.length === 0 ? (
          <EmptyState title="Немає доступностей" description="Додайте свій перший розклад вище" />
        ) : (
          <div className="space-y-3">
            {availabilities.sort((a: any, b: any) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()).map((avail: any) => {
              const start = new Date(avail.startDatetime)
              const end = new Date(avail.endDatetime)
              const durMins = avail.slotDuration || 30
              const totalSlots = Math.floor((end.getTime() - start.getTime()) / 60000 / durMins)
              const slots = avail.slots || []
              // Filter active bookings (booked or completed)
              const activeBookings = slots.filter((s: any) => s.status !== 'cancelled')
              const bookedCount = activeBookings.length
              const freeCount = Math.max(0, totalSlots - bookedCount)
              const isExpanded = expandedRows[avail.id]

              return (
                <div key={avail.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:border-primary/50">
                  <div 
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/10"
                    onClick={() => toggleRow(avail.id)}
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="font-bold text-base">{start.toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} — {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                          <span className="mx-2">•</span> 
                          Слот: {durMins} хв
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-accent">
                        {avail.track?.name || 'Всі треки'}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded border border-green-200 dark:border-green-800">
                          {freeCount} вільних
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                          {bookedCount} заброньованих
                        </span>
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteMut.mutate(avail.id) }}
                        disabled={bookedCount > 0 || deleteMut.isPending}
                        title={bookedCount > 0 ? "Неможливо видалити: є заброньовані слоти" : "Видалити доступність"}
                        className="p-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-4">
                      <h5 className="text-sm font-semibold mb-3">Заброньовані слоти:</h5>
                      {activeBookings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Жоден слот ще не заброньовано.</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                          {activeBookings.sort((a: any, b: any) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()).map((slot: any) => (
                            <div key={slot.id} className="p-3 rounded-lg border border-border bg-background text-sm">
                              <p className="font-mono font-medium mb-1 text-primary">
                                {new Date(slot.startDatetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                              <p className="font-semibold truncate" title={slot.team?.name}>{slot.team?.name || 'Невідома команда'}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{slot.status}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
