import api from './client'
import type { ApiResponse, MentorAvailability, MentorSlot } from '@/types/api.types'

export const mentorshipApi = {
  listAvailabilities: (params?: { hackathonId?: string }) =>
    api.get<ApiResponse<MentorAvailability[]>>('/mentorship/availabilities', { params }),

  getSlots: (availabilityId: string) =>
    api.get<ApiResponse<MentorSlot[]>>(`/mentorship/availabilities/${availabilityId}/slots`),

  updateSlotStatus: (slotId: string, status: 'completed' | 'cancelled') =>
    api.patch<ApiResponse<MentorSlot>>(`/mentorship/slots/${slotId}/status`, { status }),
}
