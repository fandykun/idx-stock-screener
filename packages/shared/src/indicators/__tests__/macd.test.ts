import { describe, expect, it } from 'vitest'
import { calculateMACD } from '../macd.js'

describe('calculateMACD', () => {
  it('returns null when fewer than 35 closes are provided', () => {
    expect(calculateMACD(Array.from({ length: 34 }, (_, index) => index + 1))).toBeNull()
  })

  it('returns macd, signal, and histogram where histogram equals macd minus signal', () => {
    const result = calculateMACD(Array.from({ length: 60 }, (_, index) => 100 + index * 1.5 + Math.sin(index)))
    expect(result).not.toBeNull()
    expect(result?.histogram).toBeCloseTo((result?.macd ?? 0) - (result?.signal ?? 0), 10)
  })
})
