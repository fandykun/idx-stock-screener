import websocket from '@fastify/websocket'
import type { FastifyPluginAsync } from 'fastify'
import { demoStocks } from '../data/demoData.js'
import { isIdxMarketHours } from '../lib/marketHours.js'

interface PriceMessage {
  type: 'snapshot' | 'update'
  prices: Record<string, number>
}

export const websocketPlugin: FastifyPluginAsync = async (app) => {
  await app.register(websocket)

  app.get('/ws/prices', { websocket: true }, (socket) => {
    socket.send(JSON.stringify({ type: 'snapshot', prices: latestPrices() } satisfies PriceMessage))

    const interval = setInterval(() => {
      if (!isIdxMarketHours()) return
      socket.send(JSON.stringify({ type: 'update', prices: latestPrices() } satisfies PriceMessage))
    }, 30_000)
    interval.unref()

    socket.on('close', () => clearInterval(interval))
  })
}

function latestPrices(): Record<string, number> {
  return Object.fromEntries(demoStocks.map((stock) => {
    const latest = stock.candles[stock.candles.length - 1]
    if (!latest) throw new Error(`Stock ${stock.ticker} has no candles`)
    return [stock.ticker, latest.close]
  }))
}
