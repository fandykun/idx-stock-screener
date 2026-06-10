import { describe, expect, it } from 'vitest'
import { getStubUserId } from '../authStub.js'

describe('getStubUserId', () => {
  it('returns the X-User-Id header value', () => {
    expect(getStubUserId({ headers: { 'x-user-id': 'demo-user' } })).toBe('demo-user')
  })

  it('throws 401 when the header is absent', () => {
    expect(() => getStubUserId({ headers: {} })).toThrow('X-User-Id header required in development')
  })
})
