import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import Fastify from 'fastify'
import { ZodError } from 'zod'
import { screenerRoutes } from './routes/screener.js'
import { stockRoutes } from './routes/stocks.js'

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } })

await app.register(helmet)
await app.register(cors, { origin: process.env.WEB_ORIGIN ?? true })
await app.register(stockRoutes)
await app.register(screenerRoutes)

app.get('/health', async () => ({ ok: true, service: 'idx-screener-api' }))

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: error.issues.map((issue) => issue.message).join('; ') })
  }
  const message = error instanceof Error ? error.message : 'Unexpected server error'
  app.log.error(error)
  return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error', message })
})

const port = Number(process.env.API_PORT ?? 3000)
await app.listen({ host: '0.0.0.0', port })
