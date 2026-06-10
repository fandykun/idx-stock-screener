import type { FastifyPluginAsync } from 'fastify'
import { AlertCreateSchema, AlertPatchSchema } from '@idx-screener/shared'
import { createAlert, deleteAlert, listAlerts, updateAlert } from '../data/personalStore.js'
import { getStubUserId } from '../lib/authStub.js'

export const alertRoutes: FastifyPluginAsync = async (app) => {
  app.get('/alerts', async (request) => {
    const userId = getStubUserId(request)
    return { data: listAlerts(userId) }
  })

  app.post('/alerts', async (request, reply) => {
    const userId = getStubUserId(request)
    const body = AlertCreateSchema.parse(request.body)
    return reply.status(201).send(createAlert(userId, body))
  })

  app.patch('/alerts/:id', async (request, reply) => {
    const userId = getStubUserId(request)
    const params = request.params as { id?: string }
    if (!params.id) return reply.status(400).send({ message: 'Alert id is required' })
    const body = AlertPatchSchema.parse(request.body)
    return updateAlert(userId, params.id, body)
  })

  app.delete('/alerts/:id', async (request, reply) => {
    const userId = getStubUserId(request)
    const params = request.params as { id?: string }
    if (!params.id) return reply.status(400).send({ message: 'Alert id is required' })
    deleteAlert(userId, params.id)
    return reply.status(204).send()
  })
}
