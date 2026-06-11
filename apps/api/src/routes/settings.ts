import type { FastifyPluginAsync } from 'fastify'
import { generateTelegramToken } from '../data/personalStore.js'

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/settings/telegram-token', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId
    return reply.status(201).send({ token: generateTelegramToken(userId), command: '/start <token>' })
  })
}
