import { describe, expect, it } from 'vitest'
import { calculateEMA, calculateSMA } from '../ma.js'

describe('moving averages', () => {
  it('calculates the SMA from the most recent values', () => {
    expect(calculateSMA([1, 2, 3, 4, 5], 3)).toBe(4)
  })

  it('returns null for invalid SMA periods or insufficient data', () => {
    expect(calculateSMA([1, 2], 3)).toBeNull()
    expect(calculateSMA([1, 2], 0)).toBeNull()
  })

  it('calculates EMA with the first period SMA as seed', () => {
    expect(calculateEMA([1, 2, 3, 4, 5], 3)).toBeCloseTo(4, 5)
  })

  it('returns null for invalid EMA periods or insufficient data', () => {
    expect(calculateEMA([1, 2], 3)).toBeNull()
    expect(calculateEMA([1, 2], -1)).toBeNull()
  })
})
