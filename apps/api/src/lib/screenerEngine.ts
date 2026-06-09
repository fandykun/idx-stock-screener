import { calculateBollinger, calculateMACD, calculateRSI, calculateSMA, isVolumeSurge, type ScreenerFilter } from '@idx-screener/shared'
import type { Stock } from '../data/demoData.js'

export interface StockSnapshot {
  ticker: string
  name: string
  sector: string
  price: number
  change1d: number
  volume: number
  rsi: number | null
  sma20: number | null
  sma50: number | null
  macd: number | null
  macdSignal: number | null
  volumeSurge: boolean
  pe: number
  pbv: number
  roe: number
  der: number
  eps: number
  marketCap: number
}

function latestSnapshot(stock: Stock): StockSnapshot {
  const closes = stock.candles.map((candle) => candle.close)
  const volumes = stock.candles.map((candle) => candle.volume)
  const latest = stock.candles[stock.candles.length - 1]
  const previous = stock.candles[stock.candles.length - 2]
  if (!latest || !previous) throw new Error(`Stock ${stock.ticker} has insufficient candle data`)
  const macd = calculateMACD(closes)
  return {
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    price: latest.close,
    change1d: ((latest.close - previous.close) / previous.close) * 100,
    volume: latest.volume,
    rsi: calculateRSI(closes),
    sma20: calculateSMA(closes, 20),
    sma50: calculateSMA(closes, 50),
    macd: macd?.macd ?? null,
    macdSignal: macd?.signal ?? null,
    volumeSurge: isVolumeSurge(volumes.slice(0, -1), latest.volume),
    ...stock.fundamental,
  }
}

function compareNumeric(actual: number | null, operator: ScreenerFilter['operator'], expected: number | [number, number]): boolean {
  if (actual === null) return false
  if (Array.isArray(expected)) return actual >= expected[0] && actual <= expected[1]
  switch (operator) {
    case 'lt': return actual < expected
    case 'lte': return actual <= expected
    case 'gt': return actual > expected
    case 'gte': return actual >= expected
    case 'eq': return actual === expected
    case 'between': return false
    default: return false
  }
}

function stockMatches(snapshot: StockSnapshot, filter: ScreenerFilter): boolean {
  const value = filter.value
  switch (filter.metric) {
    case 'rsi': return typeof value === 'number' || Array.isArray(value) ? compareNumeric(snapshot.rsi, filter.operator, value as number | [number, number]) : false
    case 'price': return typeof value === 'number' || Array.isArray(value) ? compareNumeric(snapshot.price, filter.operator, value as number | [number, number]) : false
    case 'change1d': return typeof value === 'number' || Array.isArray(value) ? compareNumeric(snapshot.change1d, filter.operator, value as number | [number, number]) : false
    case 'pe': return typeof value === 'number' || Array.isArray(value) ? compareNumeric(snapshot.pe, filter.operator, value as number | [number, number]) : false
    case 'pbv': return typeof value === 'number' || Array.isArray(value) ? compareNumeric(snapshot.pbv, filter.operator, value as number | [number, number]) : false
    case 'roe': return typeof value === 'number' || Array.isArray(value) ? compareNumeric(snapshot.roe, filter.operator, value as number | [number, number]) : false
    case 'der': return typeof value === 'number' || Array.isArray(value) ? compareNumeric(snapshot.der, filter.operator, value as number | [number, number]) : false
    case 'market_cap': return typeof value === 'string' ? marketCapTier(snapshot.marketCap) === value : compareNumeric(snapshot.marketCap, filter.operator, value as number | [number, number])
    case 'sector': return Array.isArray(value) ? value.some((item) => item === snapshot.sector) : snapshot.sector === value
    case 'volume_surge': return snapshot.volumeSurge === (value === 'true' || value === 1)
    default: return true
  }
}

function marketCapTier(marketCap: number): string {
  if (marketCap < 1_000_000_000_000) return 'small'
  if (marketCap <= 10_000_000_000_000) return 'mid'
  return 'large'
}

export function runScreener(stocks: readonly Stock[], filters: readonly ScreenerFilter[]): StockSnapshot[] {
  return stocks.map(latestSnapshot).filter((snapshot) => filters.every((filter) => stockMatches(snapshot, filter)))
}

export function getStockSnapshot(stock: Stock): StockSnapshot & { bollinger: ReturnType<typeof calculateBollinger> } {
  const closes = stock.candles.map((candle) => candle.close)
  return { ...latestSnapshot(stock), bollinger: calculateBollinger(closes) }
}
