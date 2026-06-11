import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import Fastify, { type FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { type AuthStore, defaultAuthStore } from './data/authStore.js'
import { AuthStubError } from './lib/authStub.js'
import { jwtPlugin } from './plugins/jwt.js'
import { websocketPlugin } from './plugins/websocket.js'
import { alertRoutes } from './routes/alerts.js'
import { authRoutes } from './routes/auth.js'
import { screenerRoutes } from './routes/screener.js'
import { settingsRoutes } from './routes/settings.js'
import { stockRoutes } from './routes/stocks.js'
import { watchlistRoutes } from './routes/watchlist.js'

export interface CreateAppOptions {
  authStore?: AuthStore
  jwtSecret?: string
}

export async function createApp(options: CreateAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } })
  const jwtSecret = options.jwtSecret ?? process.env.JWT_SECRET

  await app.register(helmet)
  await app.register(cors, { origin: process.env.WEB_ORIGIN ?? true })
  if (jwtSecret) {
    await app.register(jwtPlugin, { secret: jwtSecret })
    await app.register(authRoutes, { authStore: options.authStore ?? defaultAuthStore })
  }
  await app.register(websocketPlugin)
  await app.register(stockRoutes)
  await app.register(screenerRoutes)
  await app.register(watchlistRoutes)
  await app.register(alertRoutes)
  await app.register(settingsRoutes)

  app.get('/health', async () => ({ ok: true, service: 'idx-screener-api' }))

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: error.issues.map((issue) => issue.message).join('; ') })
    }
    if (error instanceof AuthStubError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, error: 'Unauthorized', message: error.message })
    }
    const statusCode = typeof (error as { statusCode?: unknown }).statusCode === 'number' ? (error as { statusCode: number }).statusCode : 500
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    if (statusCode >= 500) app.log.error(error)
    return reply.status(statusCode).send({ statusCode, error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error', message })
  })

  return app
}
