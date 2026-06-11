import { describe, expect, it } from 'vitest'
import { createApp } from '../../app.js'
import { InMemoryAuthStore } from '../../data/authStore.js'

describe('auth routes', () => {
  it('registers a user with a bcrypt password hash', async () => {
    const authStore = new InMemoryAuthStore()
    const app = await createApp({ authStore, jwtSecret: 'test-secret' })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: ' Demo@IDX-Screener.App ', password: 'correct-horse-1' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ user: { id: expect.any(String), email: 'demo@idx-screener.app' } })
    const user = await authStore.findByEmail('demo@idx-screener.app')
    expect(user?.passwordHash).toMatch(/^\$2[aby]\$12\$/)
    expect(user?.passwordHash).not.toContain('correct-horse-1')
    await app.close()
  })

  it('rejects duplicate registration emails', async () => {
    const authStore = new InMemoryAuthStore()
    const app = await createApp({ authStore, jwtSecret: 'test-secret' })
    const payload = { email: 'demo@idx-screener.app', password: 'correct-horse-1' }

    expect((await app.inject({ method: 'POST', url: '/auth/register', payload })).statusCode).toBe(201)
    const duplicate = await app.inject({ method: 'POST', url: '/auth/register', payload })

    expect(duplicate.statusCode).toBe(409)
    expect(duplicate.json().message).toBe('Email is already registered')
    await app.close()
  })

  it('returns access and refresh tokens for correct login credentials', async () => {
    const authStore = new InMemoryAuthStore()
    const app = await createApp({ authStore, jwtSecret: 'test-secret' })
    await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'demo@idx-screener.app', password: 'correct-horse-1' } })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'demo@idx-screener.app', password: 'correct-horse-1' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ accessToken: expect.any(String), refreshToken: expect.any(String) })
    expect(response.json().accessToken).not.toBe(response.json().refreshToken)
    await app.close()
  })

  it('rejects wrong login passwords', async () => {
    const authStore = new InMemoryAuthStore()
    const app = await createApp({ authStore, jwtSecret: 'test-secret' })
    await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'demo@idx-screener.app', password: 'correct-horse-1' } })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'demo@idx-screener.app', password: 'wrong-password' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().message).toBe('Invalid email or password')
    await app.close()
  })
})
