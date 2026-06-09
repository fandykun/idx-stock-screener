function hasValidPeriod(values: readonly number[], period: number): boolean {
  return Number.isInteger(period) && period > 0 && values.length >= period
}

export function calculateSMA(values: readonly number[], period: number): number | null {
  if (!hasValidPeriod(values, period)) return null
  const window = values.slice(-period)
  return window.reduce((sum, value) => sum + value, 0) / period
}

export function calculateEMA(values: readonly number[], period: number): number | null {
  if (!hasValidPeriod(values, period)) return null
  const seedValues = values.slice(0, period)
  let ema = seedValues.reduce((sum, value) => sum + value, 0) / period
  const multiplier = 2 / (period + 1)

  for (const value of values.slice(period)) {
    ema = (value - ema) * multiplier + ema
  }

  return ema
}

export function calculateEMASeries(values: readonly number[], period: number): number[] {
  if (!hasValidPeriod(values, period)) return []
  const seedValues = values.slice(0, period)
  let ema = seedValues.reduce((sum, value) => sum + value, 0) / period
  const multiplier = 2 / (period + 1)
  const series = [ema]

  for (const value of values.slice(period)) {
    ema = (value - ema) * multiplier + ema
    series.push(ema)
  }

  return series
}
