import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.js'
import { resetPersonalStore } from '../data/personalStore.js'

describe('personal routes', () => {
  afterEach(() => resetPersonalStore())

  it('requires X-User-Id on watchlist routes', async () => {
    const app = await createApp()
    const response = await app.inject({ method: 'GET', url: '/watchlist' })
    expect(response.statusCode).toBe(401)
    await app.close()
  })

  it('adds, lists, rejects duplicates, and removes watchlist stocks', async () => {
    const app = await createApp()
    const headers = { 'x-user-id': 'demo-user' }

    expect((await app.inject({ method: 'POST', url: '/watchlist/BBCA', headers })).statusCode).toBe(201)
    expect((await app.inject({ method: 'POST', url: '/watchlist/BBCA', headers })).statusCode).toBe(409)

    const list = await app.inject({ method: 'GET', url: '/watchlist', headers })
    expect(list.statusCode).toBe(200)
    expect(list.json().data).toHaveLength(1)
    expect(list.json().data[0].ticker).toBe('BBCA')

    expect((await app.inject({ method: 'DELETE', url: '/watchlist/BBCA', headers })).statusCode).toBe(204)
    expect((await app.inject({ method: 'GET', url: '/watchlist', headers })).json().data).toHaveLength(0)
    await app.close()
  })

  it('creates, lists, toggles, and deletes alerts with ownership checks', async () => {
    const app = await createApp()
    const headers = { 'x-user-id': 'demo-user' }
    const otherHeaders = { 'x-user-id': 'other-user' }

    const create = await app.inject({
      method: 'POST',
      url: '/alerts',
      headers,
      payload: { ticker: 'BBCA', type: 'TECHNICAL', metric: 'rsi', operator: 'lt', threshold: 30 },
    })
    expect(create.statusCode).toBe(201)
    const alertId = create.json().id as string

    expect((await app.inject({ method: 'GET', url: '/alerts', headers })).json().data).toHaveLength(1)
    expect((await app.inject({ method: 'PATCH', url: `/alerts/${alertId}`, headers: otherHeaders, payload: { active: false } })).statusCode).toBe(403)

    const toggle = await app.inject({ method: 'PATCH', url: `/alerts/${alertId}`, headers, payload: { active: false } })
    expect(toggle.statusCode).toBe(200)
    expect(toggle.json().active).toBe(false)

    expect((await app.inject({ method: 'DELETE', url: `/alerts/${alertId}`, headers })).statusCode).toBe(204)
    await app.close()
  })

  it('generates a Telegram link token for settings', async () => {
    const app = await createApp()
    const response = await app.inject({ method: 'POST', url: '/settings/telegram-token', headers: { 'x-user-id': 'demo-user' } })
    expect(response.statusCode).toBe(201)
    expect(response.json().token).toMatch(/^[a-f0-9]{32}$/)
    await app.close()
  })
})
