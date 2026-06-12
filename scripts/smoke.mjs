#!/usr/bin/env node

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000'
const webBaseUrl = process.env.WEB_BASE_URL ?? 'http://localhost:4173'
const smokeEmail = process.env.SMOKE_EMAIL ?? `smoke-${Date.now()}-${Math.random().toString(16).slice(2)}@idx-screener.test`
const smokePassword = process.env.SMOKE_PASSWORD ?? 'password123'

async function requestJson(path, init = {}) {
  const headers = {
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers ?? {}),
  }
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${init.method ?? 'GET'} ${path} failed with ${response.status}: ${text}`)
  }
  if (response.status === 204) return null
  return response.json()
}

function bearer(accessToken) {
  return { Authorization: `Bearer ${accessToken}` }
}

async function assertPublicApi() {
  const health = await requestJson('/health')
  if (health.ok !== true) throw new Error('Health endpoint did not return ok=true')

  const screener = await requestJson('/screener?limit=3')
  if (!Array.isArray(screener.data) || screener.data.length === 0) throw new Error('Screener returned no data')

  const candles = await requestJson('/stocks/BBCA/candles?timeframe=1W')
  if (!Array.isArray(candles.data) || candles.data.length === 0) throw new Error('BBCA candles returned no data')
}

async function assertAuthFlow() {
  const registration = await requestJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: smokeEmail, password: smokePassword }),
  })
  if (registration.user?.email !== smokeEmail) throw new Error('Registration did not return the smoke user')

  const tokens = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: smokeEmail, password: smokePassword }),
  })
  assertTokenPair(tokens, 'login')

  const unauthenticatedWatchlist = await fetch(`${apiBaseUrl}/watchlist`)
  if (unauthenticatedWatchlist.status !== 401) {
    throw new Error(`GET /watchlist without JWT returned ${unauthenticatedWatchlist.status}, expected 401`)
  }

  const headers = bearer(tokens.accessToken)
  return { headers, refreshToken: tokens.refreshToken }
}

async function assertPersonalApi(headers) {
  await requestJson('/watchlist/BBCA', { method: 'POST', headers }).catch((error) => {
    if (!String(error.message).includes('409')) throw error
  })
  const watchlist = await requestJson('/watchlist', { headers })
  if (!Array.isArray(watchlist.data) || !watchlist.data.some((item) => item.ticker === 'BBCA')) {
    throw new Error('Watchlist did not contain BBCA after add')
  }

  const alert = await requestJson('/alerts', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ticker: 'BBCA', type: 'TECHNICAL', metric: 'rsi', operator: 'lt', threshold: 30 }),
  })
  if (!alert.id) throw new Error('Alert creation did not return an id')

  const alerts = await requestJson('/alerts', { headers })
  if (!Array.isArray(alerts.data) || !alerts.data.some((item) => item.id === alert.id)) {
    throw new Error('Created alert was not listed')
  }

  const token = await requestJson('/settings/telegram-token', { method: 'POST', headers })
  if (typeof token.command !== 'string' || !token.command.startsWith('/start ')) {
    throw new Error('Telegram token command was not returned')
  }
}

async function assertRefreshAndLogout(refreshToken) {
  const refreshed = await requestJson('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
  assertTokenPair(refreshed, 'refresh')

  const replay = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (replay.status !== 401) throw new Error(`Refresh token replay returned ${replay.status}, expected 401`)

  await requestJson('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshed.refreshToken }),
  })

  const afterLogout = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshed.refreshToken }),
  })
  if (afterLogout.status !== 401) throw new Error(`Refresh after logout returned ${afterLogout.status}, expected 401`)
}

function assertTokenPair(value, source) {
  if (typeof value.accessToken !== 'string' || value.accessToken.length < 20) {
    throw new Error(`${source} did not return a valid access token`)
  }
  if (typeof value.refreshToken !== 'string' || value.refreshToken.length < 20) {
    throw new Error(`${source} did not return a valid refresh token`)
  }
}

async function assertWeb() {
  const response = await fetch(webBaseUrl)
  if (!response.ok) throw new Error(`Web root failed with ${response.status}`)
  const html = await response.text()
  if (!html.includes('<div id="root">')) throw new Error('Web root did not look like Vite app shell')
}

async function main() {
  await assertPublicApi()
  const { headers, refreshToken } = await assertAuthFlow()
  await assertPersonalApi(headers)
  await assertRefreshAndLogout(refreshToken)
  await assertWeb()
  console.log(`Smoke checks passed for API ${apiBaseUrl} and Web ${webBaseUrl}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
