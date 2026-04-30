import api from './client'
import type { ApiResponse } from '@/types/api.types'

export const projectsApi = {
  getById: (id: string) =>
    api.get<ApiResponse<unknown>>(`/projects/${id}`),

  listByTeam: (teamId: string) =>
    api.get<ApiResponse<unknown[]>>(`/projects`, { params: { team_id: teamId } }),

  review: (id: string, data: { status: string; comment?: string }) =>
    api.post<ApiResponse<unknown>>(`/projects/${id}/review`, data),

  listResources: (projectId: string) =>
    api.get<ApiResponse<unknown[]>>(`/projects/${projectId}/resources`),
}
