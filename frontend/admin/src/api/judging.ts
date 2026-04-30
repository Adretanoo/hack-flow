import api from './client'
import type { ApiResponse, PaginatedResponse, Criteria, Score, LeaderboardEntry } from '@/types/api.types'

export const judgingApi = {
  getLeaderboard: (hackathonId: string) =>
    api.get<ApiResponse<LeaderboardEntry[]>>(`/judging/leaderboard/${hackathonId}`),

  listCriteria: (trackId: string) =>
    api.get<ApiResponse<Criteria[]>>(`/judging/criteria/track/${trackId}`),

  createCriteria: (data: { trackId: string; name: string; maxScore: number; weight: number; description?: string }) =>
    api.post<ApiResponse<Criteria>>('/judging/criteria', data),

  deleteCriteria: (id: string) =>
    api.delete(`/judging/criteria/${id}`),

  getProjectScores: (projectId: string) =>
    api.get<ApiResponse<Score[]>>(`/judging/scores/project/${projectId}`),

  listAllConflicts: (params?: { hackathonId?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<unknown>>('/judging/conflicts/all', { params }),
}
