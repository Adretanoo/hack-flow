import api from './client'
import type { ApiResponse, MentorAvailability, MentorSlot } from '@/types/api.types'

export const mentorshipApi = {
  listAvailabilities: (params?: { hackathonId?: string }) =>
    api.get<ApiResponse<MentorAvailability[]>>('/mentorship/availabilities', { params }),

  getSlots: (availabilityId: string) =>
    api.get<ApiResponse<MentorSlot[]>>(`/mentorship/availabilities/${availabilityId}/requests`),

  completeSlot: (slotId: string) =>
    api.patch<ApiResponse<MentorSlot>>(`/mentorship/requests/${slotId}/complete`),

  cancelSlot: (slotId: string) =>
    api.patch<ApiResponse<MentorSlot>>(`/mentorship/requests/${slotId}/cancel`),
}
