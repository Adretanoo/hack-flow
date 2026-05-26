import api from './client'
import type { ApiResponse, UserProfile, UserSocial } from '@/types/api.types'

export const usersApi = {
  getMe: () =>
    api.get<ApiResponse<UserProfile>>('/users/me'),

  getUsers: (params?: { role?: string; search?: string; limit?: number; page?: number }) =>
    api.get<ApiResponse<UserProfile[]>>('/users', { params }),

  getUserById: (id: string) =>
    api.get<ApiResponse<UserProfile>>(`/users/${id}`),

  updateMe: (data: Partial<Omit<UserProfile, 'socials'>>) =>
    api.patch<ApiResponse<UserProfile>>('/users/me', data),

  getSocials: () =>
    api.get<ApiResponse<UserSocial[]>>('/users/me/socials'),

  addSocial: (data: { typeSocial: UserSocial['typeSocial']; url: string }) =>
    api.post<ApiResponse<UserSocial>>('/users/me/socials', data),

  deleteSocial: (id: string) =>
    api.delete<ApiResponse<void>>(`/users/me/socials/${id}`),
}
