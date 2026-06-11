import { describe, expect, it } from 'vitest'
import { LoginSchema, RefreshSchema, RegisterSchema } from '../auth.js'

describe('auth schemas', () => {
  it('normalizes register email and accepts a strong password', () => {
    const parsed = RegisterSchema.parse({ email: '  Demo@IDX-Screener.App ', password: 'correct-horse-1' })

    expect(parsed).toEqual({ email: 'demo@idx-screener.app', password: 'correct-horse-1' })
  })

  it('rejects short register passwords', () => {
    expect(() => RegisterSchema.parse({ email: 'demo@idx-screener.app', password: 'short1' })).toThrow()
  })

  it('normalizes login email without relaxing the password field', () => {
    const parsed = LoginSchema.parse({ email: ' DEMO@IDX-SCREENER.APP ', password: 'user input password' })

    expect(parsed).toEqual({ email: 'demo@idx-screener.app', password: 'user input password' })
  })

  it('requires a non-empty refresh token', () => {
    expect(RefreshSchema.parse({ refreshToken: 'refresh-token-value' })).toEqual({ refreshToken: 'refresh-token-value' })
    expect(() => RefreshSchema.parse({ refreshToken: '' })).toThrow()
  })
})
