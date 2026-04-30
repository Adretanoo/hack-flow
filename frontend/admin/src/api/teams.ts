import api from './client'
import type { ApiResponse } from '@/types/api.types'

export interface TeamListParams {
  page?: number
  limit?: number
  hackathon_id?: string
  track_id?: string
  status?: string
  search?: string
}

export const teamsApi = {
  list: (params?: TeamListParams) =>
    api.get<{ success: boolean; data: unknown[]; total: number; page: number; limit: number }>(
      '/teams', { params },
    ),

  getById: (id: string) =>
    api.get<ApiResponse<unknown>>(`/teams/${id}`),

  getMembers: (teamId: string) =>
    api.get<ApiResponse<unknown[]>>(`/teams/${teamId}/members`),

  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`),

  updateApproval: (teamId: string, data: { status: string; comment?: string }) =>
    api.patch<ApiResponse<unknown>>(`/teams/${teamId}/approval`, data),

  createInvite: (teamId: string, data?: { maxUses?: number; expiresInHours?: number }) =>
    api.post<ApiResponse<unknown>>(`/teams/${teamId}/invites`, data ?? {}),
}
