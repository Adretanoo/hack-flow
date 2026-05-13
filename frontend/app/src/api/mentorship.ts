import api from './client'
import type { ApiResponse, PaginatedResponse, MentorRequest, MentorAvailability } from '@/types/api.types'

export const mentorshipApi = {
  getAvailableMentors: (params?: { hackathonId?: string; trackId?: string }) =>
    api.get<PaginatedResponse<MentorAvailability & { mentor: { fullName: string, avatarUrl: string | null } }>>('/mentorship/availabilities', { params }),

  getMentorRequests: (availabilityId: string) =>
    api.get<ApiResponse<MentorRequest[]>>(`/mentorship/availabilities/${availabilityId}/requests`),

  createRequest: (data: { mentorAvailabilityId: string, teamId: string, startDatetime: string, durationMinute: number, message?: string }) =>
    api.post<ApiResponse<MentorRequest>>(`/mentorship/requests`, data),

  getMyRequests: (teamId: string) =>
    api.get<ApiResponse<(MentorRequest & { mentorAvailability: MentorAvailability & { user: { fullName: string } } })[]>>('/mentorship/requests', { params: { teamId } }),

  cancelRequest: (requestId: string) =>
    api.patch<ApiResponse<MentorRequest>>(`/mentorship/requests/${requestId}/cancel`),

  completeRequest: (requestId: string) =>
    api.patch<ApiResponse<MentorRequest>>(`/mentorship/requests/${requestId}/complete`),

  blockSlot: (availabilityId: string, data: { startDatetime: string, durationMinute: number }) =>
    api.post<ApiResponse<MentorRequest>>(`/mentorship/availabilities/${availabilityId}/block`, data),

  unblockSlot: (requestId: string) =>
    api.delete<ApiResponse<{success: boolean}>>(`/mentorship/requests/${requestId}/unblock`),

  acceptRequest: (requestId: string, meetingLink: string) =>
    api.patch<ApiResponse<MentorRequest>>(`/mentorship/requests/${requestId}/accept`, { meetingLink }),

  rejectRequest: (requestId: string) =>
    api.patch<ApiResponse<MentorRequest>>(`/mentorship/requests/${requestId}/reject`),

  getMyAvailabilities: (hackathonId?: string) =>
    api.get<ApiResponse<(MentorAvailability & { slots: (MentorRequest & { team: any })[], track: any })[]>>('/mentorship/availabilities/my', { params: { hackathonId } }),

  createAvailability: (data: { hackathonId?: string, trackId?: string, startDatetime: string, endDatetime: string, slotDuration: number }) =>
    api.post<ApiResponse<MentorAvailability>>('/mentorship/availabilities', data),

  deleteAvailability: (id: string) =>
    api.delete<ApiResponse<{ cancelledRequests: Array<{ id: string; teamId: string; teamName: string; startDatetime: string; durationMinute: number }> }>>(`/mentorship/availabilities/${id}`),

  getMyTracks: (hackathonId: string) =>
    api.get<ApiResponse<{ track: any }[]>>('/mentorship/my-tracks', { params: { hackathonId } }),

  getAllRequests: () =>
    api.get<ApiResponse<any[]>>('/mentorship/requests/all'),
}
