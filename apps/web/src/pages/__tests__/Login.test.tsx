// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AxiosAdapter } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { AuthProvider } from '../../hooks/useAuth'
import { apiClient, clearAuthTokens } from '../../lib/apiClient'
import { Login } from '../Login'

function renderAuthRoutes(initialPath: string): void {
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
            <Route path="/login" element={<Login />} />
            <Route path="/watchlist" element={<ProtectedRoute><main>Protected watchlist</main></ProtectedRoute>} />
            <Route path="/" element={<main>Screener home</main>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Login page', () => {
  beforeEach(() => {
    clearAuthTokens()
  })

  afterEach(() => {
    delete apiClient.defaults.adapter
    clearAuthTokens()
  })

  it('returns users to the protected route that sent them to login', async () => {
    const requestedUrls: string[] = []
    const adapter: AxiosAdapter = async (config) => {
      requestedUrls.push(config.url ?? '')
      return {
        data: { accessToken: 'access-token', refreshToken: 'refresh-token' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }
    apiClient.defaults.adapter = adapter

    renderAuthRoutes('/watchlist')

    await userEvent.type(screen.getByLabelText(/email/i), 'investor@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'correct-password')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => expect(screen.queryByText('Protected watchlist')).not.toBeNull())
    expect(screen.queryByText('Screener home')).toBeNull()
    expect(requestedUrls).toEqual(['/auth/login'])
  })
})
