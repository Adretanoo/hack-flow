import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BellRing, Video, X } from 'lucide-react'
import { mentorshipApi } from '@/api/mentorship'
import { useAuthStore } from '@/store/auth.store'
import { useI18n } from '@/i18n'

export function UpcomingSessionAlert() {
  const { user } = useAuthStore()
  const { t } = useI18n()
  const isMentor = user?.role === 'mentor' || user?.role === 'admin'
  const [dismissedSlotId, setDismissedSlotId] = useState<string | null>(null)

  // Only run if user is mentor
  const { data: availabilitiesData } = useQuery({
    queryKey: ['my-availabilities'],
    queryFn: () => mentorshipApi.getMyAvailabilities().then(res => res.data.data),
    enabled: isMentor,
    refetchInterval: 60000 // refresh every minute to get latest slots
  })

  const [upcomingSlot, setUpcomingSlot] = useState<any>(null)
  const [minutesLeft, setMinutesLeft] = useState<number>(0)

  useEffect(() => {
    if (!availabilitiesData) return

    const checkUpcoming = () => {
      const now = new Date()
      let nextSlot: any = null
      let minDiff = Infinity

      availabilitiesData.forEach((avail: any) => {
        if (avail.slots) {
          avail.slots.forEach((s: any) => {
            if (s.status === 'booked' && s.id !== dismissedSlotId) {
              const st = new Date(s.startDatetime)
              const diffMs = st.getTime() - now.getTime()
              const diffMins = Math.ceil(diffMs / 60000)
              
              if (diffMins > 0 && diffMins <= 15 && diffMins < minDiff) {
                minDiff = diffMins
                nextSlot = { ...s, trackName: avail.track?.name }
              }
            }
          })
        }
      })

      setUpcomingSlot(nextSlot)
      setMinutesLeft(minDiff)
    }

    checkUpcoming()
    const interval = setInterval(checkUpcoming, 60000)
    return () => clearInterval(interval)
  }, [availabilitiesData, dismissedSlotId])

  if (!upcomingSlot) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up-fade max-w-sm w-full">
      <div className="rounded-xl border border-green-200 bg-green-50 shadow-xl overflow-hidden relative p-4 flex gap-4 items-start dark:bg-green-950/80 dark:border-green-900">
        <button 
          onClick={() => setDismissedSlotId(upcomingSlot.id)}
          className="absolute top-2 right-2 text-green-600/50 hover:text-green-600 dark:text-green-400/50 dark:hover:text-green-400"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="shrink-0 p-2 bg-green-100 rounded-full text-green-600 dark:bg-green-900/50 dark:text-green-400 mt-1">
          <BellRing className="h-5 w-5 animate-pulse" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-bold text-green-900 dark:text-green-100 mb-1 leading-tight">
            {t.mentor.sessionImminentHeader(minutesLeft)}
          </h4>
          <p className="text-sm text-green-800 dark:text-green-300 mb-3">
            {t.mentor.sessionWaitingTeam(upcomingSlot.team?.name || t.adminDashboardPage.notSpecified)}
          </p>
          
          {upcomingSlot.meetingLink && (
            <a 
              href={upcomingSlot.meetingLink} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex w-full justify-center items-center gap-2 bg-green-600 text-white hover:bg-green-700 transition-colors py-2 rounded-lg text-sm font-bold shadow-sm"
              onClick={() => setDismissedSlotId(upcomingSlot.id)}
            >
              <Video className="h-4 w-4" /> {t.mentor.joinCall}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
