import type { ScreenerFilter } from '@idx-screener/shared'

export interface Candle {
  ticker: string
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Fundamental {
  pe: number
  pbv: number
  roe: number
  der: number
  eps: number
  marketCap: number
}

export interface Stock {
  ticker: string
  name: string
  sector: string
  fundamental: Fundamental
  candles: Candle[]
}

const tickers = [
  ['BBCA', 'Bank Central Asia', 'Financials', 31.2, 4.7, 0.211, 0.78, 310, 1180000000000000],
  ['BBRI', 'Bank Rakyat Indonesia', 'Financials', 14.8, 2.1, 0.188, 5.4, 290, 720000000000000],
  ['TLKM', 'Telkom Indonesia', 'Telecoms', 12.5, 2.5, 0.176, 0.44, 245, 310000000000000],
  ['ASII', 'Astra International', 'Consumer Discretionary', 7.4, 0.95, 0.134, 0.69, 845, 205000000000000],
  ['BMRI', 'Bank Mandiri', 'Financials', 13.2, 2.4, 0.201, 4.7, 520, 605000000000000],
  ['UNVR', 'Unilever Indonesia', 'Consumer Staples', 18.5, 19.5, 0.965, 3.1, 95, 82000000000000],
  ['ICBP', 'Indofood CBP Sukses', 'Consumer Staples', 15.9, 2.8, 0.167, 0.48, 720, 126000000000000],
  ['KLBF', 'Kalbe Farma', 'Healthcare', 20.1, 3.2, 0.151, 0.18, 82, 78000000000000],
  ['PGAS', 'Perusahaan Gas Negara', 'Energy', 8.8, 1.05, 0.097, 0.62, 180, 41000000000000],
  ['ADRO', 'Adaro Energy', 'Energy', 6.2, 0.88, 0.225, 0.31, 430, 73000000000000],
  ['INDF', 'Indofood Sukses Makmur', 'Consumer Staples', 9.1, 0.92, 0.112, 0.86, 780, 64000000000000],
  ['SMGR', 'Semen Indonesia', 'Materials', 10.7, 0.72, 0.061, 0.59, 310, 26000000000000],
  ['ANTM', 'Aneka Tambang', 'Materials', 11.3, 1.58, 0.103, 0.22, 140, 39500000000000],
  ['BBNI', 'Bank Negara Indonesia', 'Financials', 9.8, 1.35, 0.142, 5.1, 520, 192000000000000],
  ['GGRM', 'Gudang Garam', 'Consumer Staples', 7.9, 0.48, 0.062, 0.38, 2550, 28000000000000],
] as const

function buildCandles(ticker: string, seed: number): Candle[] {
  const now = Date.now()
  const candles: Candle[] = []
  let close = seed
  for (let index = 139; index >= 0; index -= 1) {
    const wave = Math.sin((140 - index) / 7) * seed * 0.01
    const drift = (140 - index) * seed * 0.0007
    const noise = Math.cos((140 - index) * 1.7) * seed * 0.004
    const nextClose = Math.max(50, seed + drift + wave + noise)
    const open = close
    const high = Math.max(open, nextClose) * 1.008
    const low = Math.min(open, nextClose) * 0.992
    candles.push({
      ticker,
      timestamp: new Date(now - index * 24 * 60 * 60 * 1000).toISOString(),
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(nextClose),
      volume: Math.round(6_000_000 + ((140 - index) % 20) * 220_000 + seed * 80),
    })
    close = nextClose
  }
  return candles
}

export const demoStocks: Stock[] = tickers.map(([ticker, name, sector, pe, pbv, roe, der, eps, marketCap], index) => {
  const seed = [9300, 4100, 2800, 5050, 6500, 1750, 10800, 1660, 1620, 2450, 7400, 3900, 1650, 5150, 14500][index] ?? 1000
  return { ticker, name, sector, fundamental: { pe, pbv, roe, der, eps, marketCap }, candles: buildCandles(ticker, seed) }
})

export function getStock(ticker: string): Stock | undefined {
  return demoStocks.find((stock) => stock.ticker === ticker.toUpperCase())
}

export function parseFilters(rawFilters: string | undefined): ScreenerFilter[] {
  if (!rawFilters) return []
  const parsed: unknown = JSON.parse(rawFilters)
  if (!Array.isArray(parsed)) throw new Error('filters must be a JSON array')
  return parsed as ScreenerFilter[]
}
