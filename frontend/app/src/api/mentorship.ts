import api from './client'
import type { ApiResponse, PaginatedResponse, MentorSlot, MentorAvailability } from '@/types/api.types'

export const mentorshipApi = {
  getAvailableMentors: (params?: { hackathonId?: string; trackId?: string }) =>
    api.get<PaginatedResponse<MentorAvailability & { user: { fullName: string, avatarUrl: string | null } }>>('/mentorship/availability', { params }),

  getMentorSlots: (availabilityId: string) =>
    api.get<ApiResponse<MentorSlot[]>>(`/mentorship/availability/${availabilityId}/slots`),

  bookSlot: (slotId: string, teamId: string) =>
    api.post<ApiResponse<MentorSlot>>(`/mentorship/slots/${slotId}/book`, { teamId }),

  getMyBookings: (teamId: string) =>
    api.get<ApiResponse<(MentorSlot & { mentorAvailability: MentorAvailability & { user: { fullName: string } } })[]>>('/mentorship/slots', { params: { teamId } }),

  cancelBooking: (slotId: string) =>
    api.patch<ApiResponse<MentorSlot>>(`/mentorship/slots/${slotId}/status`, { status: 'cancelled' }),

  completeBooking: (slotId: string) =>
    api.patch<ApiResponse<MentorSlot>>(`/mentorship/slots/${slotId}/status`, { status: 'completed' }),

  getMyAvailabilities: (hackathonId?: string) =>
    api.get<ApiResponse<(MentorAvailability & { slots: (MentorSlot & { team: any })[], track: any })[]>>('/mentorship/availabilities/my', { params: { hackathonId } }),

  createAvailability: (data: { hackathonId?: string, trackId?: string, startDatetime: string, endDatetime: string, slotDuration: number }) =>
    api.post<ApiResponse<MentorAvailability>>('/mentorship/availabilities', data),

  deleteAvailability: (id: string) =>
    api.delete(`/mentorship/availabilities/${id}`),
}
