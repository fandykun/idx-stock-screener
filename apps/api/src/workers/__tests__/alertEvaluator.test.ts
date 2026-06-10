import { afterEach, describe, expect, it } from 'vitest'
import { createAlert, resetPersonalStore } from '../../data/personalStore.js'
import { evaluateAlertsOnce } from '../alertEvaluator.js'

describe('evaluateAlertsOnce', () => {
  afterEach(() => resetPersonalStore())

  it('fires active alerts that meet the condition', () => {
    createAlert('demo-user', { ticker: 'BBCA', type: 'FUNDAMENTAL', metric: 'pe', operator: 'gt', threshold: 1 })
    const jobs = evaluateAlertsOnce(new Date('2026-06-10T03:00:00.000Z'))
    expect(jobs).toHaveLength(1)
    expect(jobs[0]?.ticker).toBe('BBCA')
    expect(jobs[0]?.message).toContain('Alert triggered — BBCA')
  })

  it('does not fire the same alert twice inside the four-hour cooldown', () => {
    createAlert('demo-user', { ticker: 'BBCA', type: 'FUNDAMENTAL', metric: 'pe', operator: 'gt', threshold: 1 })
    expect(evaluateAlertsOnce(new Date('2026-06-10T03:00:00.000Z'))).toHaveLength(1)
    expect(evaluateAlertsOnce(new Date('2026-06-10T04:00:00.000Z'))).toHaveLength(0)
  })
})
