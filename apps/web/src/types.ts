export interface StockRow {
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

export interface Candle {
  ticker: string
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PageResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
