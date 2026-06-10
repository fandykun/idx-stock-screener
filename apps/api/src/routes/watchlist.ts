import type { FastifyPluginAsync } from 'fastify'
import { StockParamsSchema } from '@idx-screener/shared'
import { addWatchlistItem, listWatchlistItems, removeWatchlistItem } from '../data/personalStore.js'
import { getStubUserId } from '../lib/authStub.js'

export const watchlistRoutes: FastifyPluginAsync = async (app) => {
  app.get('/watchlist', async (request) => {
    const userId = getStubUserId(request)
    return { data: listWatchlistItems(userId) }
  })

  app.post('/watchlist/:ticker', async (request, reply) => {
    const userId = getStubUserId(request)
    const params = StockParamsSchema.parse(request.params)
    return reply.status(201).send(addWatchlistItem(userId, params.ticker))
  })

  app.delete('/watchlist/:ticker', async (request, reply) => {
    const userId = getStubUserId(request)
    const params = StockParamsSchema.parse(request.params)
    removeWatchlistItem(userId, params.ticker)
    return reply.status(204).send()
  })
}
