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
  reason?: string
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
}
