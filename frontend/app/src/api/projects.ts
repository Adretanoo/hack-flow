import api from './client'
import type { ApiResponse, PaginatedResponse, Project, ProjectResource } from '@/types/api.types'

export const projectsApi = {
  getById: (id: string) =>
    api.get<ApiResponse<Project>>(`/projects/${id}`),

  list: (params?: { teamId?: string; stageId?: string }) =>
    api.get<PaginatedResponse<Project>>('/projects', { params }),

  create: (data: { teamId: string; stageId: string; title: string; description?: string }) =>
    api.post<ApiResponse<Project>>('/projects', data),

  submit: (id: string) =>
    api.post<ApiResponse<Project>>(`/projects/${id}/submit`),

  reopen: (id: string) =>
    api.patch<ApiResponse<Project>>(`/projects/${id}/reopen`),
    
  update: (id: string, data: { title?: string; description?: string }) =>
    api.patch<ApiResponse<Project>>(`/projects/${id}`, data),

  getResources: (id: string) =>
    api.get<ApiResponse<ProjectResource[]>>(`/projects/${id}/resources`),

  addResource: (id: string, data: { url: string; projectTypeId: string; description?: string }) =>
    api.post<ApiResponse<ProjectResource>>(`/projects/${id}/resources`, data),

  removeResource: (id: string, resourceId: string) =>
    api.delete<ApiResponse<void>>(`/projects/${id}/resources/${resourceId}`),

  getResourceTypes: () =>
    api.get<ApiResponse<{ id: string; name: string }[]>>('/projects/resource-types'),
}
