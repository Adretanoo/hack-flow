import api from './client'
import type { ApiResponse, Hackathon } from '@/types/api.types'

export const hackathonsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; publishStatus?: string }) =>
    api.get<{ success: boolean; data: Hackathon[]; total: number; page: number; limit: number }>('/hackathons', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Hackathon>>(`/hackathons/${id}`),

  getResults: (id: string) =>
    api.get<ApiResponse<any>>(`/judging/results/${id}`),
}

