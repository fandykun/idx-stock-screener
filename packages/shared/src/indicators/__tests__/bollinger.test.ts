import { describe, expect, it } from 'vitest'
import { calculateBollinger } from '../bollinger.js'

describe('calculateBollinger', () => {
  it('returns null when there is insufficient data', () => {
    expect(calculateBollinger([1, 2, 3], 20)).toBeNull()
  })

  it('calculates ordered bands around the 20-period SMA', () => {
    const result = calculateBollinger(Array.from({ length: 20 }, (_, index) => index + 1), 20)
    expect(result).not.toBeNull()
    expect(result?.middle).toBe(10.5)
    expect(result?.upper).toBeGreaterThan(result?.middle ?? 0)
    expect(result?.middle).toBeGreaterThan(result?.lower ?? 0)
  })
})
