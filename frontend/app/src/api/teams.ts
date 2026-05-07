import api from './client'
import type { ApiResponse, PaginatedResponse, Team } from '@/types/api.types'

export const teamsApi = {
  list: (params?: { page?: number; limit?: number; hackathon_id?: string; track_id?: string; status?: string; search?: string }) =>
    api.get<PaginatedResponse<Team>>('/teams', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Team>>(`/teams/${id}`),

  create: (data: { hackathonId: string; trackId?: string; name: string; description?: string; logo?: string }) =>
    api.post<ApiResponse<Team>>('/teams', data),

  join: (token: string) =>
    api.post<ApiResponse<{ teamId: string }>>(`/teams/join/${token}`),

  createInvite: (id: string, maxUses: number = 10, expireHours: number = 24) =>
    api.post<ApiResponse<{ token: string; expiresAt: string; maxUses: number }>>(`/teams/${id}/invites`, { maxUses, expireHours }),

  removeMember: (teamId: string, userId: string) =>
    api.delete<ApiResponse<void>>(`/teams/${teamId}/members/${userId}`),
    
  leaveTeam: (teamId: string) =>
    api.delete<ApiResponse<void>>(`/teams/${teamId}/leave`),
}
