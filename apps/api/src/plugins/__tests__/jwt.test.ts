import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { jwtPlugin } from '../jwt.js'

describe('jwtPlugin', () => {
  it('authenticates bearer tokens and exposes the user payload', async () => {
    const app = Fastify({ logger: false })
    await app.register(jwtPlugin, { secret: 'test-secret' })
    app.get('/protected', { preHandler: [app.authenticate] }, async (request) => ({ user: request.user }))

    const token = app.jwt.sign({ userId: 'user-1', email: 'demo@idx-screener.app' })
    const response = await app.inject({ method: 'GET', url: '/protected', headers: { authorization: `Bearer ${token}` } })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ user: { userId: 'user-1', email: 'demo@idx-screener.app', iat: expect.any(Number) } })
    await app.close()
  })

  it('rejects requests without a bearer token', async () => {
    const app = Fastify({ logger: false })
    await app.register(jwtPlugin, { secret: 'test-secret' })
    app.get('/protected', { preHandler: [app.authenticate] }, async () => ({ ok: true }))

    const response = await app.inject({ method: 'GET', url: '/protected' })

    expect(response.statusCode).toBe(401)
    await app.close()
  })
})
