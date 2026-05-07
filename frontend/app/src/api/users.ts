import api from './client'
import type { ApiResponse, UserProfile } from '@/types/api.types'

export const usersApi = {
  getMe: () => 
    api.get<ApiResponse<UserProfile>>('/users/me'),
    
  updateMe: (data: Partial<UserProfile>) =>
    api.patch<ApiResponse<UserProfile>>('/users/me', data),
    
  getSocials: () =>
    api.get<ApiResponse<unknown[]>>('/users/me/socials'),
    
  addSocial: (data: { platform: string; url: string }) =>
    api.post<ApiResponse<unknown>>('/users/me/socials', data),
}
