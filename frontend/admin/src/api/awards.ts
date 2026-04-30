import api from './client'
import type { ApiResponse, Award } from '@/types/api.types'

export const awardsApi = {
  list: (hackathonId: string) =>
    api.get<ApiResponse<Award[]>>(`/hackathons/${hackathonId}/awards`),

  create: (hackathonId: string, data: { name: string; place: number; description?: string; certificate?: string }) =>
    api.post<ApiResponse<Award>>(`/hackathons/${hackathonId}/awards`, data),

  update: (hackathonId: string, id: string, data: Partial<Award>) =>
    api.patch<ApiResponse<Award>>(`/hackathons/${hackathonId}/awards/${id}`, data),

  delete: (hackathonId: string, id: string) =>
    api.delete(`/hackathons/${hackathonId}/awards/${id}`),

  assignToTeam: (teamId: string, awardId: string) =>
    api.post(`/teams/${teamId}/awards/${awardId}`),
}
