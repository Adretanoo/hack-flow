import api from './client'
import type { ApiResponse, PaginatedResponse, Team } from '@/types/api.types'

export interface TeamInvite {
  id: string
  teamId: string
  token: string
  expiresAt: string
  maxUses: number
  usesCount: number
  active: boolean
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: 'captain' | 'participant'
  joinedAt: string
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
    username?: string
  }
}

export interface JoinRequest {
  id: string
  teamId: string
  userId: string
  message?: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
    username?: string
  }
}

export const teamsApi = {
  list: (params?: {
    page?: number
    limit?: number
    hackathon_id?: string
    track_id?: string
    status?: string
    search?: string
  }) => api.get<PaginatedResponse<Team>>('/teams', { params }),

  getById: (id: string) => api.get<ApiResponse<Team>>(`/teams/${id}`),

  /** Get current user's team for a hackathon — includes approvals. */
  getMyTeam: (hackathonId: string) =>
    api.get<ApiResponse<Team | null>>('/teams/my-team', { params: { hackathonId } }),

  /** Get all teams the user is a member of (across all hackathons). */
  getMyTeams: () =>
    api.get<ApiResponse<Team[]>>('/teams/my-teams'),

  getMembers: (id: string) => api.get<ApiResponse<TeamMember[]>>(`/teams/${id}/members`),

  create: (data: {
    hackathonId: string
    trackId?: string
    name: string
    description?: string
    logo?: string
  }) => api.post<ApiResponse<Team>>('/teams', data),

  update: (id: string, data: { name?: string; description?: string; trackId?: string; logo?: string }) =>
    api.patch<ApiResponse<Team>>(`/teams/${id}`, data),

  deleteTeam: (id: string) =>
    api.delete<ApiResponse<void>>(`/teams/${id}`),

  /** Admin-only: move a team to a different track. */
  changeTrack: (teamId: string, trackId: string) =>
    api.patch<ApiResponse<Team>>(`/teams/${teamId}/track`, { trackId }),

  /** Join via raw token (or full URL — extract token before calling) */
  join: (token: string) =>
    api.post<ApiResponse<Team>>('/teams/join', { token }),

  getActiveInvite: (id: string) =>
    api.get<ApiResponse<TeamInvite | null>>(`/teams/${id}/invites/active`),

  createInvite: (id: string, maxUses = 10, expiresInHours = 24) =>
    api.post<ApiResponse<TeamInvite>>(`/teams/${id}/invites`, { maxUses, expiresInHours }),

  transferCaptain: (id: string, newCaptainId: string) =>
    api.patch<ApiResponse<void>>(`/teams/${id}/transfer-captain`, { newCaptainId }),

  removeMember: (teamId: string, userId: string) =>
    api.delete<ApiResponse<void>>(`/teams/${teamId}/members/${userId}`),

  leaveTeam: (teamId: string) =>
    api.delete<ApiResponse<void>>(`/teams/${teamId}/leave`),

  sendJoinRequest: (teamId: string, message?: string) =>
    api.post<ApiResponse<{ id: string }>>(`/teams/${teamId}/requests`, { message }),

  getJoinRequests: (teamId: string) =>
    api.get<ApiResponse<JoinRequest[]>>(`/teams/${teamId}/requests`),

  respondToJoinRequest: (requestId: string, action: 'accepted' | 'rejected') =>
    api.patch<ApiResponse<void>>(`/teams/requests/${requestId}`, { action }),
}

/** Extract raw token from either a full join URL or a raw token string */
export function extractToken(input: string): string {
  return input.split('/join/').pop()?.trim() ?? input.trim()
}
