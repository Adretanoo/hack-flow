import api from './client'
import type { ApiResponse, LeaderboardEntry, Score, Criteria } from '@/types/api.types'

export interface SubmitScoreDto {
  projectId: string
  criteriaId: string
  assessment: number
  comment?: string
}

export interface ReportConflictDto {
  teamId: string
  reason?: 'MENTORED' | 'RELATIVE'
}

export const judgingApi = {
  getLeaderboard: (hackathonId: string) =>
    api.get<ApiResponse<LeaderboardEntry[]>>(`/judging/leaderboard/${hackathonId}`),

  getTeamScores: (projectId: string) =>
    api.get<ApiResponse<(Score & { criteria: { name: string; maxScore: number; weight: number } })[]>>(`/judging/scores/project/${projectId}`),

  getMyScores: () =>
    api.get<ApiResponse<Score[]>>('/judging/scores/my'),

  submitScore: (data: SubmitScoreDto) =>
    api.post<ApiResponse<Score>>('/judging/scores', data),

  getCriteriaByTrack: (trackId: string) =>
    api.get<ApiResponse<Criteria[]>>(`/judging/criteria/track/${trackId}`),

  getMyConflicts: () =>
    api.get<ApiResponse<any[]>>('/judging/conflicts'),

  reportConflict: (data: ReportConflictDto) =>
    api.post<ApiResponse<any>>('/judging/conflicts', data),

  getMyTracks: (hackathonId: string) =>
    api.get<ApiResponse<any[]>>('/judging/my-tracks', { params: { hackathonId } }),

  getTeamsForJudge: (hackathonId: string) =>
    api.get<ApiResponse<any[]>>('/judging/teams', { params: { hackathonId } }),

  getAllConflicts: (hackathonId?: string) =>
    api.get<ApiResponse<any>>('/judging/conflicts/all', { params: hackathonId ? { hackathonId } : undefined }),

  adminCreateConflict: (data: { judgeId: string; teamId: string; reason?: 'MENTORED' | 'RELATIVE' }) =>
    api.post<ApiResponse<any>>('/judging/conflicts/admin', data),

  adminDeleteConflict: (id: string) =>
    api.delete<void>(`/judging/conflicts/${id}`),

  adminUpdateConflict: (id: string, reason: 'MENTORED' | 'RELATIVE') =>
    api.patch<ApiResponse<any>>(`/judging/conflicts/${id}`, { reason }),

  createCriteria: (data: { trackId: string; name: string; maxScore: number; weight: number; description?: string }) =>
    api.post<ApiResponse<any>>('/judging/criteria', data),

  deleteCriteria: (id: string) =>
    api.delete<ApiResponse<any>>(`/judging/criteria/${id}`),

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
}
