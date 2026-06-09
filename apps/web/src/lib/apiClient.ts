import axios from 'axios'

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000' })

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message = typeof error.response?.data === 'object' && error.response?.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : error.message
      return Promise.reject(new Error(message))
    }
    return Promise.reject(error)
  },
)
