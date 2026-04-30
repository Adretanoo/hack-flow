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
  // GET /judge-track/:hackathonId — all assignments for a hackathon
  list: (hackathonId: string) =>
    api.get<ApiResponse<JudgeAssignment[]>>(`/judge-track/${hackathonId}`),

  // POST /judge-track — assign a judge to a track
  assign: (data: { userId: string; trackId: string; isHeadJudge?: boolean }) =>
    api.post<ApiResponse<JudgeAssignment>>('/judge-track', data),

  // PATCH /judge-track/:id — update head-judge flag
  update: (id: string, data: { isHeadJudge: boolean }) =>
    api.patch<ApiResponse<JudgeAssignment>>(`/judge-track/${id}`, data),

  // DELETE /judge-track/:id — remove assignment
  remove: (id: string) =>
    api.delete(`/judge-track/${id}`),

  // GET /judge-track/:hackathonId/track/:trackId — judges for a specific track
  listByTrack: (hackathonId: string, trackId: string) =>
    api.get<ApiResponse<JudgeAssignment[]>>(`/judge-track/${hackathonId}/track/${trackId}`),
}
