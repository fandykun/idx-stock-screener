// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AxiosAdapter } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { apiClient, clearAuthTokens } from '../../lib/apiClient'
import { AuthProvider, useAuth } from '../useAuth'

function renderAuthApp(initialPath: string): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<main>Screener home</main>} />
            <Route path="/login" element={<main>Login page</main>} />
            <Route path="/watchlist" element={<ProtectedRoute><main>Protected watchlist</main></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function LogoutButton(): JSX.Element {
  const auth = useAuth()
  return <button type="button" onClick={auth.logout}>Logout</button>
}

function renderLogoutApp(initialPath: string): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <LogoutButton />
          <Routes>
            <Route path="/" element={<main>Screener home</main>} />
            <Route path="/login" element={<main>Login page</main>} />
            <Route path="/watchlist" element={<ProtectedRoute><main>Protected watchlist</main></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    clearAuthTokens()
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    delete apiClient.defaults.adapter
    clearAuthTokens()
    window.localStorage.clear()
  })

  it('silently refreshes an existing refresh token before showing protected routes', async () => {
    const requestedUrls: string[] = []
    window.localStorage.setItem('idx-screener.refreshToken', 'refresh-token')
    const adapter: AxiosAdapter = async (config) => {
      requestedUrls.push(config.url ?? '')
      return {
        data: { accessToken: 'fresh-access-token', refreshToken: 'fresh-refresh-token' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }
    apiClient.defaults.adapter = adapter

    renderAuthApp('/watchlist')

    await waitFor(() => expect(screen.queryByText('Protected watchlist')).not.toBeNull())
    expect(screen.queryByText('Login page')).toBeNull()
    expect(requestedUrls).toEqual(['/auth/refresh'])
  })

  it('clears auth state and redirects to the public home page on logout', async () => {
    window.localStorage.setItem('idx-screener.accessToken', 'access-token')
    window.localStorage.setItem('idx-screener.refreshToken', 'refresh-token')
    const requestedUrls: string[] = []
    const adapter: AxiosAdapter = async (config) => {
      requestedUrls.push(config.url ?? '')
      return { data: {}, status: 204, statusText: 'No Content', headers: {}, config }
    }
    apiClient.defaults.adapter = adapter

    renderLogoutApp('/watchlist')

    await waitFor(() => expect(screen.queryByText('Protected watchlist')).not.toBeNull())
    await userEvent.click(screen.getByRole('button', { name: /logout/i }))

    await waitFor(() => expect(screen.queryByText('Screener home')).not.toBeNull())
    expect(screen.queryByText('Login page')).toBeNull()
    expect(requestedUrls).toEqual(['/auth/logout'])
    expect(window.localStorage.getItem('idx-screener.accessToken')).toBeNull()
    expect(window.localStorage.getItem('idx-screener.refreshToken')).toBeNull()
  })
})
