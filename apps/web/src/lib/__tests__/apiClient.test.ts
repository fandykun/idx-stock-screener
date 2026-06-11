import type { AxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'
import { apiClient, clearAuthTokens, getAccessToken, setAuthTokens } from '../apiClient'

function headerValue(config: AxiosRequestConfig | null, name: string): unknown {
  if (!config?.headers) return undefined
  return Object.entries(config.headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1]
}

describe('apiClient auth headers', () => {
  beforeEach(() => {
    clearAuthTokens()
  })

  it('does not send the old X-User-Id development auth stub header', async () => {
    let capturedConfig: AxiosRequestConfig | null = null
    apiClient.defaults.adapter = async (config) => {
      capturedConfig = config
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    await apiClient.get('/watchlist')

    expect(headerValue(capturedConfig, 'X-User-Id')).toBeUndefined()
  })

  it('attaches bearer access tokens when available', async () => {
    let capturedConfig: AxiosRequestConfig | null = null
    setAuthTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' })
    apiClient.defaults.adapter = async (config) => {
      capturedConfig = config
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    await apiClient.get('/watchlist')

    expect(getAccessToken()).toBe('access-token')
    expect(headerValue(capturedConfig, 'Authorization')).toBe('Bearer access-token')
  })

  it('refreshes expired access tokens once and retries the original request', async () => {
    const requestedUrls: string[] = []
    const authorizationHeaders: unknown[] = []
    setAuthTokens({ accessToken: 'expired-token', refreshToken: 'refresh-token' })
    apiClient.defaults.adapter = async (config) => {
      requestedUrls.push(config.url ?? '')
      authorizationHeaders.push(headerValue(config, 'Authorization'))
      if (config.url === '/watchlist' && requestedUrls.filter((url) => url === '/watchlist').length === 1) {
        return Promise.reject({
          isAxiosError: true,
          config,
          response: { status: 401, data: { message: 'Unauthorized' }, statusText: 'Unauthorized', headers: {}, config },
          message: 'Unauthorized',
        })
      }
      if (config.url === '/auth/refresh') {
        return { data: { accessToken: 'fresh-token', refreshToken: 'fresh-refresh-token' }, status: 200, statusText: 'OK', headers: {}, config }
      }
      return { data: { data: [] }, status: 200, statusText: 'OK', headers: {}, config }
    }

    const response = await apiClient.get('/watchlist')

    expect(response.data).toEqual({ data: [] })
    expect(requestedUrls).toEqual(['/watchlist', '/auth/refresh', '/watchlist'])
    expect(getAccessToken()).toBe('fresh-token')
    expect(authorizationHeaders).toEqual(['Bearer expired-token', 'Bearer expired-token', 'Bearer fresh-token'])
  })
})
