import api from './client'
import type { LoginDto, RegisterDto, ApiResponse, UserProfile } from '@/types/api.types'

export const authApi = {
  login: (data: LoginDto) => 
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: UserProfile }>>('/auth/login', data),
    
  register: (data: RegisterDto) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: UserProfile }>>('/auth/register', data),
    
  logout: () => 
    api.post<ApiResponse<void>>('/auth/logout'),
    
  getMe: () => 
    api.get<ApiResponse<UserProfile>>('/users/me'),
}
