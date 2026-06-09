import { describe, expect, it } from 'vitest'
import { isVolumeSurge } from '../volume.js'

describe('isVolumeSurge', () => {
  it('detects a volume surge against the 20-period average', () => {
    expect(isVolumeSurge(Array.from({ length: 20 }, () => 100), 250, 2)).toBe(true)
  })

  it('does not flag ordinary volume', () => {
    expect(isVolumeSurge(Array.from({ length: 20 }, () => 100), 150, 2)).toBe(false)
  })

  it('returns false when there is not enough history', () => {
    expect(isVolumeSurge([100, 100], 500, 2)).toBe(false)
  })
})
