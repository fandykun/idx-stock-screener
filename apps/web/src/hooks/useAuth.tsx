import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiClient, clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '../lib/apiClient'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface AuthContextValue {
  isAuthenticated: boolean
  isCheckingSession: boolean
  isLoggingOut: boolean
  login(email: string, password: string, redirectTo?: string): Promise<void>
  register(email: string, password: string): Promise<void>
  logout(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(() => getAccessToken() !== null)
  const [isCheckingSession, setIsCheckingSession] = useState(() => getAccessToken() === null && getRefreshToken() !== null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    if (getAccessToken() !== null) {
      setIsCheckingSession(false)
      return
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      setIsCheckingSession(false)
      return
    }

    let isActive = true
    async function restoreSession(): Promise<void> {
      try {
        const response = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken })
        if (!isActive) return
        setAuthTokens(response.data)
        setIsAuthenticated(true)
      } catch {
        if (!isActive) return
        clearAuthTokens()
        setIsAuthenticated(false)
      } finally {
        if (isActive) setIsCheckingSession(false)
      }
    }

    void restoreSession()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (isLoggingOut && location.pathname === '/') setIsLoggingOut(false)
  }, [isLoggingOut, location.pathname])

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated,
    isCheckingSession,
    isLoggingOut,
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
      setIsLoggingOut(true)
      navigate('/', { replace: true })
      clearAuthTokens()
      setIsAuthenticated(false)
      if (refreshToken) {
        void apiClient.post('/auth/logout', { refreshToken }).catch(() => undefined)
      }
    },
  }), [isAuthenticated, isCheckingSession, isLoggingOut, navigate])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
