import api from './client'
import type { ApiResponse } from '@/types/api.types'

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  lookingForTeam?: boolean
}

export const usersApi = {
  list: (params?: UserListParams) =>
    api.get<{ success: boolean; data: unknown[]; total: number; page: number; limit: number }>(
      '/users', { params },
    ),

  getById: (id: string) =>
    api.get<ApiResponse<unknown>>(`/users/${id}`),

  getUserActivity: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<unknown[]>>(`/audit-log/user/${id}`, { params }),
}
