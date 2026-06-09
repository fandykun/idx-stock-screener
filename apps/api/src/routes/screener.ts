import type { FastifyPluginAsync } from 'fastify'
import { ScreenerQuerySchema } from '@idx-screener/shared'
import { demoStocks } from '../data/demoData.js'
import { runScreener, type StockSnapshot } from '../lib/screenerEngine.js'

function sortableValue(snapshot: StockSnapshot, sortBy: string): string | number | boolean | null {
  if (sortBy === 'market_cap') return snapshot.marketCap
  if (sortBy === 'volume_surge') return snapshot.volumeSurge
  return snapshot[sortBy as keyof StockSnapshot] ?? null
}

export const screenerRoutes: FastifyPluginAsync = async (app) => {
  app.get('/screener', async (request) => {
    const query = ScreenerQuerySchema.parse(request.query)
    const results = runScreener(demoStocks, query.filters)
    const direction = query.sortDir === 'desc' ? -1 : 1
    const sorted = [...results].sort((left, right) => {
      const leftValue = sortableValue(left, query.sortBy)
      const rightValue = sortableValue(right, query.sortBy)
      if (typeof leftValue === 'number' && typeof rightValue === 'number') return (leftValue - rightValue) * direction
      return String(leftValue).localeCompare(String(rightValue)) * direction
    })
    return {
      data: sorted.slice((query.page - 1) * query.limit, query.page * query.limit),
      total: sorted.length,
      page: query.page,
      limit: query.limit,
    }
  })
}
