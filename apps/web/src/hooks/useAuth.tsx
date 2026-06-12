import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '../lib/apiClient'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface AuthContextValue {
  isAuthenticated: boolean
  login(email: string, password: string, redirectTo?: string): Promise<void>
  register(email: string, password: string): Promise<void>
  logout(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(() => getAccessToken() !== null)

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated,
    async login(email: string, password: string, redirectTo = '/'): Promise<void> {
      const response = await apiClient.post<AuthTokens>('/auth/login', { email, password })
      setAuthTokens(response.data)
      setIsAuthenticated(true)
      navigate(redirectTo)
    },
    async register(email: string, password: string): Promise<void> {
      await apiClient.post('/auth/register', { email, password })
      navigate('/login')
    },
    logout(): void {
      const refreshToken = getRefreshToken()
      clearAuthTokens()
      setIsAuthenticated(false)
      if (refreshToken) {
        void apiClient.post('/auth/logout', { refreshToken }).catch(() => undefined)
      }
      navigate('/login')
    },
  }), [isAuthenticated, navigate])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
