import api from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { UserProfile } from '@/types/api.types'

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  lookingForTeam?: boolean
}

export const usersApi = {
  list: (params?: UserListParams) =>
    api.get<PaginatedResponse<UserProfile>>(
      '/users', { params },
    ),

  getById: (id: string) =>
    api.get<ApiResponse<unknown>>(`/users/${id}`),

  getUserActivity: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<unknown[]>>(`/users/${id}/activity`, { params }),

  updateRole: (id: string, role: string) =>
    api.put<ApiResponse<unknown>>(`/users/${id}/role`, { role }),
}
