import type { FastifyPluginAsync } from 'fastify'
import { generateTelegramToken } from '../data/personalStore.js'
import { getStubUserId } from '../lib/authStub.js'

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/settings/telegram-token', async (request, reply) => {
    const userId = getStubUserId(request)
    return reply.status(201).send({ token: generateTelegramToken(userId), command: '/start <token>' })
  })
}
