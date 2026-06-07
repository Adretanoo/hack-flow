import api from './client'
import type { ApiResponse, Hackathon, Track, Stage } from '@/types/api.types'

export interface OrganizerHackathonListParams {
  page?: number
  limit?: number
  publishStatus?: string
  search?: string
}

export interface CreateHackathonDto {
  title: string
  subtitle?: string
  description?: string
  location?: string
  online?: boolean
  startDate: string
  endDate: string
  minTeamSize?: number
  maxTeamSize?: number
  contactEmail?: string
  banner?: string
  rulesUrl?: string
  tags?: string[]
  tracks?: Array<{ name: string; description?: string; guidelines?: string }>
  stages?: Array<{ name: string; startDate: string; endDate: string; orderIndex: number; type?: string }>
  awards?: Array<{ name: string; description?: string; place: number; certificate?: string }>
}

export const organizerApi = {
  // ── Hackathons ──────────────────────────────────────────────────────────
  list: (params?: OrganizerHackathonListParams) =>
    api.get<{ success: boolean; data: Hackathon[]; total: number; page: number; limit: number }>(
      '/hackathons', { params },
    ),

  getById: (id: string) =>
    api.get<ApiResponse<Hackathon>>(`/hackathons/${id}`),

  create: (data: CreateHackathonDto) =>
    api.post<ApiResponse<Hackathon>>('/hackathons', data),

  update: (id: string, data: Partial<CreateHackathonDto>) =>
    api.patch<ApiResponse<Hackathon>>(`/hackathons/${id}`, data),

  delete: (id: string) =>
    api.delete(`/hackathons/${id}`),

  overrideStatus: (id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') =>
    api.post<ApiResponse<Hackathon>>(`/hackathons/${id}/status`, { status }),

  // ── Tracks ──────────────────────────────────────────────────────────────
  listTracks: (id: string) =>
    api.get<ApiResponse<Track[]>>(`/hackathons/${id}/tracks`),

  createTrack: (id: string, data: Partial<Track>) =>
    api.post<ApiResponse<Track>>(`/hackathons/${id}/tracks`, data),

  updateTrack: (id: string, data: Partial<Track>) =>
    api.put<ApiResponse<Track>>(`/hackathons/tracks/${id}`, data),

  deleteTrack: (trackId: string) =>
    api.delete(`/hackathons/tracks/${trackId}`),

  // ── Stages ──────────────────────────────────────────────────────────────
  listStages: (id: string) =>
    api.get<ApiResponse<Stage[]>>(`/hackathons/${id}/stages`),

  createStage: (id: string, data: Partial<Stage>) =>
    api.post<ApiResponse<Stage>>(`/hackathons/${id}/stages`, data),

  updateStage: (id: string, data: Partial<Stage>) =>
    api.put<ApiResponse<Stage>>(`/hackathons/stages/${id}`, data),

  deleteStage: (stageId: string) =>
    api.delete(`/hackathons/stages/${stageId}`),

  // ── Teams (manage approval) ──────────────────────────────────────────────
  listTeams: (hackathonId: string, params?: { page?: number; limit?: number; status?: string }) =>
    api.get<any>(`/teams`, { params: { hackathon_id: hackathonId, ...params } }),

  approveTeam: (teamId: string, comment?: string) =>
    api.patch(`/teams/${teamId}/approval`, { status: 'APPROVED', comment }),

  rejectTeam: (teamId: string, comment?: string) =>
    api.patch(`/teams/${teamId}/approval`, { status: 'REJECTED', comment }),
}
