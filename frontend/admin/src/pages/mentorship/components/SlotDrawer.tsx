import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mentorshipApi } from '@/api/mentorship'
import { formatDateTime } from '@/utils/format'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import type { MentorSlot } from '@/types/api.types'

interface SlotDrawerProps {
  availabilityId: string | null
  onClose: () => void
}

export function SlotDrawer({ availabilityId, onClose }: SlotDrawerProps) {
  const qc = useQueryClient()

  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['slots', availabilityId],
    queryFn: () => mentorshipApi.getSlots(availabilityId!),
    enabled: !!availabilityId,
  })

  const statusMut = useMutation({
    mutationFn: ({ slotId, status }: { slotId: string; status: 'completed' | 'cancelled' }) =>
      mentorshipApi.updateSlotStatus(slotId, status),
    onSuccess: () => {
      toast.success('Статус оновлено')
      qc.invalidateQueries({ queryKey: ['slots', availabilityId] })
    },
    onError: () => toast.error('Помилка оновлення'),
  })

  const slots = (slotsData?.data.data ?? []) as (MentorSlot & { team?: { name: string } })[]

  if (!availabilityId) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-background shadow-2xl animate-slide-left flex flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-lg font-semibold">Слоти ментора</h3>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Завантаження...</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Слотів не знайдено.</p>
        ) : (
          slots.map((slot) => (
            <div key={slot.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={slot.status} />
                <span className="text-xs font-medium text-muted-foreground">
                  {formatDateTime(slot.startDatetime)}
                </span>
              </div>
              <div>
                <p className="font-semibold">{slot.team?.name ?? 'Вільний слот'}</p>
                <p className="text-sm text-muted-foreground">Тривалість: {slot.durationMinute} хв</p>
                {slot.meetingLink && (
                  <a href={slot.meetingLink} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                    Лінк на дзвінок
                  </a>
                )}
              </div>
              {slot.status === 'booked' && (
                <div className="flex gap-2 pt-2 border-t border-border mt-2">
                  <button onClick={() => statusMut.mutate({ slotId: slot.id, status: 'completed' })}
                    className="flex-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors">
                    Завершено
                  </button>
                  <button onClick={() => statusMut.mutate({ slotId: slot.id, status: 'cancelled' })}
                    className="flex-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90 transition-colors">
                    Скасовано
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
