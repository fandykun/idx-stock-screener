import { describe, expect, it } from 'vitest'
import { calculateRSI } from '../rsi.js'

describe('calculateRSI', () => {
  it('returns null when there is insufficient data', () => {
    expect(calculateRSI([1, 2, 3], 14)).toBeNull()
  })

  it('returns 100 when every period is a gain', () => {
    const closes = Array.from({ length: 20 }, (_, index) => index + 1)
    expect(calculateRSI(closes, 14)).toBe(100)
  })

  it('returns 0 when every period is a loss', () => {
    const closes = Array.from({ length: 20 }, (_, index) => 20 - index)
    expect(calculateRSI(closes, 14)).toBe(0)
  })

  it('uses Wilder smoothing for a mixed series', () => {
    const closes = [44, 44.15, 43.9, 44.35, 44.7, 45.1, 44.8, 45.3, 45.85, 46.1, 45.95, 46.4, 46.7, 46.55, 47, 47.3, 47.1, 47.6]
    expect(calculateRSI(closes, 14)).toBeCloseTo(81.6, 2)
  })
})
