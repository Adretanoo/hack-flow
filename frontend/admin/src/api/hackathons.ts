import api from './client'
import type { ApiResponse, PaginatedResponse, Hackathon, Track, Stage, Award, Tag } from '@/types/api.types'

export interface HackathonListParams {
  page?: number
  limit?: number
  status?: string
  publishStatus?: string
  tags?: string
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
}

// ── Hackathons ────────────────────────────────────────────────────────────
export const hackathonsApi = {
  list: (params?: HackathonListParams) =>
    api.get<PaginatedResponse<Hackathon>>('/hackathons', { params }),

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

  // ── Tracks ────────────────────────────────────────────────────────────
  listTracks: (id: string) =>
    api.get<ApiResponse<Track[]>>(`/hackathons/${id}/tracks`),

  createTrack: (id: string, data: { name: string; description?: string }) =>
    api.post<ApiResponse<Track>>(`/hackathons/${id}/tracks`, data),

  deleteTrack: (trackId: string) =>
    api.delete(`/hackathons/tracks/${trackId}`),

  // ── Stages ────────────────────────────────────────────────────────────
  listStages: (id: string) =>
    api.get<ApiResponse<Stage[]>>(`/hackathons/${id}/stages`),

  createStage: (id: string, data: { name: string; startDate: string; endDate: string; orderIndex: number }) =>
    api.post<ApiResponse<Stage>>(`/hackathons/${id}/stages`, data),

  deleteStage: (stageId: string) =>
    api.delete(`/hackathons/stages/${stageId}`),

  // ── Tags ──────────────────────────────────────────────────────────────
  listTagsForHackathon: (id: string) =>
    api.get<ApiResponse<Tag[]>>(`/hackathons/${id}/tags`),

  attachTags: (id: string, tagIds: string[]) =>
    api.post(`/hackathons/${id}/tags`, { tagIds }),

  detachTag: (id: string, tagId: string) =>
    api.delete(`/hackathons/${id}/tags/${tagId}`),

  // ── Awards ────────────────────────────────────────────────────────────
  listAwards: (id: string) =>
    api.get<ApiResponse<Award[]>>(`/hackathons/${id}/awards`),

  createAward: (id: string, data: { name: string; place: number; description?: string; certificate?: string }) =>
    api.post<ApiResponse<Award>>(`/hackathons/${id}/awards`, data),

  updateAward: (id: string, awardId: string, data: Partial<Award>) =>
    api.patch<ApiResponse<Award>>(`/hackathons/${id}/awards/${awardId}`, data),

  deleteAward: (id: string, awardId: string) =>
    api.delete(`/hackathons/${id}/awards/${awardId}`),

  addPhysicalGift: (id: string, awardId: string, data: { name: string; description?: string; image?: string }) =>
    api.post(`/hackathons/${id}/awards/${awardId}/physical-gifts`, data),

  removePhysicalGift: (id: string, awardId: string, giftId: string) =>
    api.delete(`/hackathons/${id}/awards/${awardId}/physical-gifts/${giftId}`),

  // ── Judge assignments ─────────────────────────────────────────────────
  listJudgeAssignments: (hackathonId: string) =>
    api.get<ApiResponse<unknown[]>>(`/hackathons/${hackathonId}/judges`),

  assignJudge: (hackathonId: string, data: { userId: string; trackId: string; isHeadJudge?: boolean }) =>
    api.post<ApiResponse<unknown>>(`/hackathons/${hackathonId}/judges`, data),

  updateJudgeAssignment: (hackathonId: string, judgeTrackId: string, data: { isHeadJudge: boolean }) =>
    api.patch(`/hackathons/${hackathonId}/judges/${judgeTrackId}`, data),

  unassignJudge: (hackathonId: string, judgeTrackId: string) =>
    api.delete(`/hackathons/${hackathonId}/judges/${judgeTrackId}`),

  listTrackJudges: (hackathonId: string, trackId: string) =>
    api.get<ApiResponse<unknown[]>>(`/hackathons/${hackathonId}/tracks/${trackId}/judges`),
}
