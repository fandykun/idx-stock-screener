import { describe, expect, it } from 'vitest'
import { AlertCreateSchema, AlertPatchSchema } from '../alert.js'

describe('alert schemas', () => {
  it('accepts a valid technical alert create payload', () => {
    const parsed = AlertCreateSchema.parse({ ticker: 'bbca', type: 'TECHNICAL', metric: 'rsi', operator: 'lt', threshold: 30 })
    expect(parsed.ticker).toBe('BBCA')
    expect(parsed.threshold).toBe(30)
  })

  it('rejects invalid alert metrics', () => {
    expect(() => AlertCreateSchema.parse({ ticker: 'BBCA', type: 'TECHNICAL', metric: 'unknown', operator: 'lt', threshold: 30 })).toThrow()
  })

  it('accepts active toggle patches only', () => {
    expect(AlertPatchSchema.parse({ active: false })).toEqual({ active: false })
  })
})
