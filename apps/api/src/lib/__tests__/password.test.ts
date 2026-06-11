import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../password.js'

describe('password utilities', () => {
  it('hashes passwords with bcrypt cost 12 and verifies the original password', async () => {
    const hash = await hashPassword('correct-horse-1')

    expect(hash).toMatch(/^\$2[aby]\$12\$/)
    await expect(verifyPassword('correct-horse-1', hash)).resolves.toBe(true)
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false)
  })
})
