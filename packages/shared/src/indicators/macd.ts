import { calculateEMA, calculateEMASeries } from './ma.js'

export interface MACDResult {
  macd: number
  signal: number
  histogram: number
}

export function calculateMACD(closes: readonly number[]): MACDResult | null {
  if (closes.length < 35) return null

  const ema12Series = calculateEMASeries(closes, 12)
  const ema26Series = calculateEMASeries(closes, 26)
  if (ema12Series.length === 0 || ema26Series.length === 0) return null

  const offset = ema12Series.length - ema26Series.length
  const macdSeries = ema26Series.flatMap((ema26, index) => {
    const ema12 = ema12Series[index + offset]
    return ema12 === undefined ? [] : [ema12 - ema26]
  })
  const signal = calculateEMA(macdSeries, 9)
  if (signal === null) return null

  const macd = macdSeries[macdSeries.length - 1]
  if (macd === undefined) return null
  return {
    macd,
    signal,
    histogram: macd - signal,
  }
}
