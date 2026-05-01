import api from './client'
import type { ApiResponse } from '@/types/api.types'

export interface JudgeAssignment {
  id: string
  userId: string
  trackId: string
  isHeadJudge: boolean
  user?: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string | null
  }
}

export const judgeTrackApi = {
  // GET /hackathons/:hackathonId/judges — all assignments for a hackathon
  list: (hackathonId: string) =>
    api.get<ApiResponse<JudgeAssignment[]>>(`/hackathons/${hackathonId}/judges`),

  // POST /hackathons/:hackathonId/judges — assign a judge to a track
  assign: (hackathonId: string, data: { userId: string; trackId: string; isHeadJudge?: boolean }) =>
    api.post<ApiResponse<JudgeAssignment>>(`/hackathons/${hackathonId}/judges`, data),

  // PATCH /hackathons/:hackathonId/judges/:id — update head-judge flag
  update: (hackathonId: string, id: string, data: { isHeadJudge: boolean }) =>
    api.patch<ApiResponse<JudgeAssignment>>(`/hackathons/${hackathonId}/judges/${id}`, data),

  // DELETE /hackathons/:hackathonId/judges/:id — remove assignment
  remove: (hackathonId: string, id: string) =>
    api.delete(`/hackathons/${hackathonId}/judges/${id}`),

  // GET /hackathons/:hackathonId/tracks/:trackId/judges — judges for a specific track
  listByTrack: (hackathonId: string, trackId: string) =>
    api.get<ApiResponse<JudgeAssignment[]>>(`/hackathons/${hackathonId}/tracks/${trackId}/judges`),
}
