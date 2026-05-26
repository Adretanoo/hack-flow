import api from './client'
import type { ApiResponse, PaginatedResponse, Criteria, Score, LeaderboardEntry } from '@/types/api.types'

export const judgingApi = {
  getLeaderboard: (hackathonId: string) =>
    api.get<ApiResponse<LeaderboardEntry[]>>(`/judging/leaderboard/${hackathonId}`),

  getFullResults: (hackathonId: string) =>
    api.get<ApiResponse<any>>(`/judging/results/${hackathonId}`),

  listAwards: (hackathonId: string) =>
    api.get<ApiResponse<any[]>>(`/judging/hackathons/${hackathonId}/awards`),

  createAward: (hackathonId: string, data: { name: string; place: number; description?: string }) =>
    api.post<ApiResponse<any>>(`/judging/hackathons/${hackathonId}/awards`, data),

  assignAward: (teamId: string, awardId: string) =>
    api.post<ApiResponse<any>>(`/judging/teams/${teamId}/awards/${awardId}`, {}),

  removeAward: (teamId: string, awardId: string) =>
    api.delete<ApiResponse<void>>(`/judging/teams/${teamId}/awards/${awardId}`),

  listCriteria: (trackId: string) =>
    api.get<ApiResponse<Criteria[]>>(`/judging/criteria/track/${trackId}`),

  createCriteria: (data: { trackId: string; name: string; maxScore: number; weight: number; description?: string }) =>
    api.post<ApiResponse<Criteria>>('/judging/criteria', data),

  deleteCriteria: (id: string) =>
    api.delete(`/judging/criteria/${id}`),

  updateCriteria: (id: string, data: { name?: string; maxScore?: number; weight?: number; description?: string }) =>
    api.patch<ApiResponse<Criteria>>(`/judging/criteria/${id}`, data),

  getProjectScores: (projectId: string) =>
    api.get<ApiResponse<Score[]>>(`/judging/scores/project/${projectId}`),

  listAllConflicts: (params?: { hackathonId?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<unknown>>('/judging/conflicts/all', { params }),

  adminCreateConflict: (data: { judgeId: string; teamId: string; reason?: 'MENTORED' | 'RELATIVE' }) =>
    api.post<ApiResponse<unknown>>('/judging/conflicts/admin', data),

  adminDeleteConflict: (id: string) =>
    api.delete<void>(`/judging/conflicts/${id}`),

  adminUpdateConflict: (id: string, reason: 'MENTORED' | 'RELATIVE') =>
    api.patch<ApiResponse<unknown>>(`/judging/conflicts/${id}`, { reason }),
}
