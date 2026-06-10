#!/usr/bin/env node

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000'
const webBaseUrl = process.env.WEB_BASE_URL ?? 'http://localhost:4173'
const userId = process.env.SMOKE_USER_ID ?? 'demo-user'

async function requestJson(path, init = {}) {
  const headers = {
    'X-User-Id': userId,
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

async function assertPublicApi() {
  const health = await requestJson('/health')
  if (health.ok !== true) throw new Error('Health endpoint did not return ok=true')

  const screener = await requestJson('/screener?limit=3')
  if (!Array.isArray(screener.data) || screener.data.length === 0) throw new Error('Screener returned no data')

  const candles = await requestJson('/stocks/BBCA/candles?timeframe=1W')
  if (!Array.isArray(candles.data) || candles.data.length === 0) throw new Error('BBCA candles returned no data')
}

async function assertPersonalApi() {
  await requestJson('/watchlist/BBCA', { method: 'POST' }).catch((error) => {
    if (!String(error.message).includes('409')) throw error
  })
  const watchlist = await requestJson('/watchlist')
  if (!Array.isArray(watchlist.data) || !watchlist.data.some((item) => item.ticker === 'BBCA')) {
    throw new Error('Watchlist did not contain BBCA after add')
  }

  const alert = await requestJson('/alerts', {
    method: 'POST',
    body: JSON.stringify({ ticker: 'BBCA', type: 'TECHNICAL', metric: 'rsi', operator: 'lt', threshold: 30 }),
  })
  if (!alert.id) throw new Error('Alert creation did not return an id')

  const alerts = await requestJson('/alerts')
  if (!Array.isArray(alerts.data) || !alerts.data.some((item) => item.id === alert.id)) {
    throw new Error('Created alert was not listed')
  }

  const token = await requestJson('/settings/telegram-token', { method: 'POST' })
  if (typeof token.command !== 'string' || !token.command.startsWith('/start ')) {
    throw new Error('Telegram token command was not returned')
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
  await assertPersonalApi()
  await assertWeb()
  console.log(`Smoke checks passed for API ${apiBaseUrl} and Web ${webBaseUrl}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
