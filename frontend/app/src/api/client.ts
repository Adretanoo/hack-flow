import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { refreshToken } = useAuthStore.getState()
        if (!refreshToken) {
          // Немає refresh token — тихо виходимо, RoleGuard сам перенаправить на /login
          useAuthStore.getState().logout()
          return Promise.reject(error)
        }

        const response = await axios.post<{ data: { accessToken: string } }>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        )

        const newAccessToken = response.data.data.accessToken
        useAuthStore.getState().setTokens(newAccessToken, refreshToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        const result = await axios(originalRequest)
        return result.data
      } catch (refreshError) {
        // Refresh не вдався — виходимо. RoleGuard/router сам обробить редирект
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error.response?.data || error)
  },
)

export default api
