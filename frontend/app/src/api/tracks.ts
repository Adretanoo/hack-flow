import api from './client'
import type { ApiResponse } from '@/types/api.types'

export const tracksApi = {
  list: (params?: { hackathon_id?: string; limit?: number }) =>
    api.get<ApiResponse<any[]>>('/tracks', { params }),
}
