import api from './client'
import type { ApiResponse, Tag } from '@/types/api.types'

export const tagsApi = {
  list: () => api.get<ApiResponse<Tag[]>>('/tags'),

  create: (name: string) => api.post<ApiResponse<Tag>>('/tags', { name }),

  delete: (tagId: string) => api.delete(`/tags/${tagId}`),

  listForHackathon: (hackathonId: string) =>
    api.get<ApiResponse<Tag[]>>(`/hackathons/${hackathonId}/tags`),

  attachToHackathon: (hackathonId: string, tagIds: string[]) =>
    api.post(`/hackathons/${hackathonId}/tags`, { tagIds }),

  detachFromHackathon: (hackathonId: string, tagId: string) =>
    api.delete(`/hackathons/${hackathonId}/tags/${tagId}`),
}
