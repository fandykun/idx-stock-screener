import type { FastifyPluginAsync } from 'fastify'
import { CandlesQuerySchema, StockParamsSchema } from '@idx-screener/shared'
import { demoStocks, getStock } from '../data/demoData.js'
import { getStockSnapshot, runScreener } from '../lib/screenerEngine.js'

const timeframeDays: Record<string, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }

export const stockRoutes: FastifyPluginAsync = async (app) => {
  app.get('/stocks', async (request) => {
    const query = request.query as { page?: string; limit?: string; sortBy?: string; sortDir?: string }
    const page = Math.max(Number(query.page ?? 1), 1)
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 200)
    const sortBy = query.sortBy ?? 'ticker'
    const sortDir = query.sortDir === 'desc' ? -1 : 1
    const data = runScreener(demoStocks, []).sort((left, right) => String(left[sortBy as keyof typeof left]).localeCompare(String(right[sortBy as keyof typeof right])) * sortDir)
    return { data: data.slice((page - 1) * limit, page * limit), total: data.length, page, limit }
  })

  app.get('/stocks/:ticker', async (request, reply) => {
    const params = StockParamsSchema.parse(request.params)
    const stock = getStock(params.ticker)
    if (!stock) return reply.status(404).send({ message: `Stock ${params.ticker} not found` })
    return { ...getStockSnapshot(stock), candlesAvailable: stock.candles.length }
  })

  app.get('/stocks/:ticker/candles', async (request, reply) => {
    const params = StockParamsSchema.parse(request.params)
    const query = CandlesQuerySchema.parse(request.query)
    const stock = getStock(params.ticker)
    if (!stock) return reply.status(404).send({ message: `Stock ${params.ticker} not found` })
    return { data: stock.candles.slice(-(timeframeDays[query.timeframe] ?? 30)) }
  })
}
