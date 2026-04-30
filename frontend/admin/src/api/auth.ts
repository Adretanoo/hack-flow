import api from './client'
import type { ApiResponse, UserProfile, AuthTokens } from '@/types/api.types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthTokens & { user: UserProfile }>>('/auth/login', { email, password }),

  register: (data: { email: string; username: string; fullName: string; password: string }) =>
    api.post<ApiResponse<AuthTokens>>('/auth/register', data),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
}
