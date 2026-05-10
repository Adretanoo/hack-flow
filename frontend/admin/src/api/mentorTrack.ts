import api from './client'
import type { ApiResponse } from '@/types/api.types'

export const mentorTrackApi = {
  listAssignments: (hackathonId: string) =>
    api.get<ApiResponse<unknown[]>>(`/hackathons/${hackathonId}/mentors`),

  assign: (hackathonId: string, data: { userId: string; trackId: string }) =>
    api.post<ApiResponse<unknown>>(`/hackathons/${hackathonId}/mentors`, data),

  unassign: (hackathonId: string, mentorTrackId: string) =>
    api.delete(`/hackathons/${hackathonId}/mentors/${mentorTrackId}`),

  listTrackMentors: (hackathonId: string, trackId: string) =>
    api.get<ApiResponse<unknown[]>>(`/hackathons/${hackathonId}/tracks/${trackId}/mentors`),
}
