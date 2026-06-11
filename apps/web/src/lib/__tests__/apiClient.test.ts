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
})
