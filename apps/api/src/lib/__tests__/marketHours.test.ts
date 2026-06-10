import { describe, expect, it } from 'vitest'
import { isIdxMarketHours } from '../marketHours.js'

describe('isIdxMarketHours', () => {
  it('returns true on a weekday during IDX trading hours in WIB', () => {
    expect(isIdxMarketHours(new Date('2026-06-10T03:00:00.000Z'))).toBe(true) // 10:00 WIB Wednesday
  })

  it('returns false outside trading hours', () => {
    expect(isIdxMarketHours(new Date('2026-06-10T10:00:00.000Z'))).toBe(false) // 17:00 WIB Wednesday
  })

  it('returns false on weekends', () => {
    expect(isIdxMarketHours(new Date('2026-06-13T03:00:00.000Z'))).toBe(false) // Saturday
  })
})
