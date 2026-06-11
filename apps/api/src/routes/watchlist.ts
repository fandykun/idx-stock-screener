import type { FastifyPluginAsync } from 'fastify'
import { StockParamsSchema } from '@idx-screener/shared'
import { addWatchlistItem, listWatchlistItems, removeWatchlistItem } from '../data/personalStore.js'

export const watchlistRoutes: FastifyPluginAsync = async (app) => {
  app.get('/watchlist', { preHandler: [app.authenticate] }, async (request) => {
    const userId = request.user.userId
    return { data: listWatchlistItems(userId) }
  })

  app.post('/watchlist/:ticker', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId
    const params = StockParamsSchema.parse(request.params)
    return reply.status(201).send(addWatchlistItem(userId, params.ticker))
  })

  app.delete('/watchlist/:ticker', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId
    const params = StockParamsSchema.parse(request.params)
    removeWatchlistItem(userId, params.ticker)
    return reply.status(204).send()
  })
}
