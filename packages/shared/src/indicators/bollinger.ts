import { calculateSMA } from './ma.js'

export interface BollingerBands {
  upper: number
  middle: number
  lower: number
}

export function calculateBollinger(closes: readonly number[], period = 20): BollingerBands | null {
  if (!Number.isInteger(period) || period <= 0 || closes.length < period) return null
  const window = closes.slice(-period)
  const middle = calculateSMA(closes, period)
  if (middle === null) return null

  const variance = window.reduce((sum, close) => sum + (close - middle) ** 2, 0) / period
  const standardDeviation = Math.sqrt(variance)

  return {
    upper: middle + standardDeviation * 2,
    middle,
    lower: middle - standardDeviation * 2,
  }
}
