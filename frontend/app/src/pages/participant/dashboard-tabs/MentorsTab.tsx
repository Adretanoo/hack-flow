import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Video, X, Lock } from 'lucide-react'
import { mentorshipApi } from '@/api/mentorship'
import { Avatar } from '@/components/shared/Avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate } from '@/utils/format'
import type { Hackathon, Team, MentorAvailability } from '@/types/api.types'

interface MentorsTabProps {
  hackathon: Hackathon
  myTeam?: Team
  stageInfo: ReturnType<typeof import('@/hooks/useHackathonStage').useHackathonStage>
}

export function MentorsTab({ hackathon, myTeam, stageInfo }: MentorsTabProps) {
  const queryClient = useQueryClient()
  const [selectedMentor, setSelectedMentor] = useState<MentorAvailability | null>(null)

  const { data: mentorsData, isLoading: mentorsLoading } = useQuery({
    queryKey: ['mentors', hackathon.id],
    queryFn: () => mentorshipApi.getAvailableMentors({ hackathonId: hackathon.id }),
    enabled: stageInfo.canBookMentor,
  })

  const { data: myBookingsData } = useQuery({
    queryKey: ['my-bookings', myTeam?.id],
    queryFn: () => mentorshipApi.getMyBookings(myTeam!.id),
    enabled: !!myTeam?.id && stageInfo.canBookMentor,
  })

  const cancelMut = useMutation({
    mutationFn: (slotId: string) => mentorshipApi.cancelBooking(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['mentor-slots'] })
    }
  })

  if (!stageInfo.canBookMentor) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center">
        <Lock className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Бронювання менторів недоступне</h3>
        <p className="text-muted-foreground max-w-md">
          Сесії з менторами можна забронювати лише під час етапу розробки (Hacking).
        </p>
      </div>
    )
  }

  if (!myTeam) {
    return <div className="py-24 text-center">Спершу створіть або приєднайтесь до команди</div>
  }

  const mentors = mentorsData?.data?.data || []
  const myBookings = myBookingsData?.data?.data || []

  return (
    <div className="mt-6 space-y-10">
      
      {/* My Bookings Section */}
      {myBookings.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2">Мої бронювання</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myBookings.map((booking: any) => (
              <div key={booking.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col h-full relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${booking.status === 'booked' ? 'bg-primary' : booking.status === 'completed' ? 'bg-green-500' : 'bg-destructive'}`}></div>
                <div className="flex justify-between items-start mb-3 pl-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    booking.status === 'booked' ? 'bg-primary/10 text-primary' :
                    booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {booking.status === 'booked' ? 'Заплановано' :
                     booking.status === 'completed' ? 'Завершено' : 'Скасовано'}
                  </span>
                  {booking.status === 'booked' && (
                    <button 
                      onClick={() => {
                        if (confirm('Ви впевнені, що хочете скасувати сесію?')) {
                          cancelMut.mutate(booking.id)
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      title="Скасувати"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <h4 className="font-semibold pl-2">{booking.mentorAvailability?.user?.fullName || 'Ментор'}</h4>
                
                <div className="mt-4 space-y-2 text-sm text-muted-foreground pl-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{formatDate(booking.startDatetime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{booking.durationMinute} хв</span>
                  </div>
                </div>

                {booking.status === 'booked' && booking.meetingLink && (
                  <a 
                    href={booking.meetingLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 ml-2 max-w-[calc(100%-8px)]"
                  >
                    <Video className="h-4 w-4" /> Приєднатись до дзвінка
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mentors Grid */}
      <section>
        <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2">Доступні ментори</h3>
        {mentorsLoading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : mentors.length === 0 ? (
          <EmptyState title="Немає доступних менторів" description="Зараз немає менторів з відкритими слотами" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mentors.map((mentor: any) => (
              <div key={mentor.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all flex flex-col">
                <div className="p-5 flex flex-col items-center text-center flex-1 border-b border-border">
                  <Avatar name={mentor.user?.fullName || 'Mentor'} url={mentor.user?.avatarUrl} size="lg" className="mb-3 shadow-sm" />
                  <h4 className="font-semibold">{mentor.user?.fullName}</h4>
                  
                  {mentor.topics && mentor.topics.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-3">
                      {mentor.topics.map((t: string) => (
                        <span key={t} className="text-xs font-medium bg-accent text-foreground px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-muted/20">
                  <button 
                    onClick={() => setSelectedMentor(mentor)}
                    className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Переглянути слоти
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking Modal */}
      {selectedMentor && (
        <BookingModal 
          mentor={selectedMentor} 
          teamId={myTeam.id}
          onClose={() => setSelectedMentor(null)} 
          onBooked={() => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
            setSelectedMentor(null)
          }}
        />
      )}
    </div>
  )
}

function BookingModal({ mentor, teamId, onClose, onBooked }: any) {
  const { data, isLoading } = useQuery({
    queryKey: ['mentor-slots', mentor.id],
    queryFn: () => mentorshipApi.getMentorSlots(mentor.id).then(res => res.data.data),
  })

  const bookMut = useMutation({
    mutationFn: (slotId: string) => mentorshipApi.bookSlot(slotId, teamId),
    onSuccess: () => onBooked(),
    onError: (err: any) => alert(err.message || 'Помилка бронювання')
  })

  const slots = data || []
  const availableSlots = slots.filter((s: any) => s.status !== 'booked' && s.status !== 'completed')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-lg flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="font-semibold text-lg">{mentor.user?.fullName}</h3>
            <p className="text-sm text-muted-foreground">Оберіть вільний час</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        
        <div className="overflow-y-auto p-4 flex-1">
          {isLoading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : availableSlots.length === 0 ? (
            <EmptyState title="Немає вільних слотів" description="Цей ментор зараз зайнятий" />
          ) : (
            <div className="space-y-3">
              {availableSlots.map((slot: any) => {
                const date = new Date(slot.startDatetime)
                return (
                  <div key={slot.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary transition-colors">
                    <div>
                      <p className="font-medium text-sm">{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-xs text-muted-foreground">{slot.durationMinute} хвилин</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('Підтверджуєте бронювання?')) bookMut.mutate(slot.id)
                      }}
                      disabled={bookMut.isPending}
                      className="rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                    >
                      {bookMut.isPending ? 'Зачекайте...' : 'Забронювати'}
                    </button>
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
