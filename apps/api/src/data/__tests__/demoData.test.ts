import { describe, expect, it } from 'vitest'
import { demoStocks } from '../demoData.js'

describe('demoStocks', () => {
  it('uses stable candle timestamps so seeds are idempotent', () => {
    const bbca = demoStocks.find((stock) => stock.ticker === 'BBCA')

    expect(bbca?.candles.at(-1)?.timestamp).toBe('2026-06-07T00:00:00.000Z')
  })
})
