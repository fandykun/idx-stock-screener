import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const ACCESS_TOKEN_KEY = 'idx-screener.accessToken'
const REFRESH_TOKEN_KEY = 'idx-screener.refreshToken'

let memoryAccessToken: string | null = null
let memoryRefreshToken: string | null = null

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Memory fallback still keeps the current session authenticated.
  }
}

function removeStorage(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Memory fallback already clears the current session.
  }
}

export function getAccessToken(): string | null {
  return memoryAccessToken ?? readStorage(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return memoryRefreshToken ?? readStorage(REFRESH_TOKEN_KEY)
}

export function setAuthTokens(tokens: AuthTokens): void {
  memoryAccessToken = tokens.accessToken
  memoryRefreshToken = tokens.refreshToken
  writeStorage(ACCESS_TOKEN_KEY, tokens.accessToken)
  writeStorage(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearAuthTokens(): void {
  memoryAccessToken = null
  memoryRefreshToken = null
  removeStorage(ACCESS_TOKEN_KEY)
  removeStorage(REFRESH_TOKEN_KEY)
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

function errorMessage(error: AxiosError): string {
  return typeof error.response?.data === 'object' && error.response.data !== null && 'message' in error.response.data
    ? String(error.response.data.message)
    : error.message
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error)
    }

    const requestConfig = error.config as RetryableRequestConfig | undefined
    const refreshToken = getRefreshToken()
    const shouldRefresh = error.response?.status === 401 && requestConfig && !requestConfig._retry && requestConfig.url !== '/auth/refresh' && refreshToken
    if (shouldRefresh) {
      requestConfig._retry = true
      try {
        const response = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken })
        setAuthTokens(response.data)
        requestConfig.headers.Authorization = `Bearer ${response.data.accessToken}`
        return apiClient.request(requestConfig)
      } catch (refreshError) {
        clearAuthTokens()
        if (axios.isAxiosError(refreshError)) {
          return Promise.reject(new Error(errorMessage(refreshError)))
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(new Error(errorMessage(error)))
  },
)
