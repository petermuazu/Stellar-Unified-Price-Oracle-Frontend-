import { describe, it, expect } from 'vitest'
import { DeliveryTracker, backoffMs } from './deliveryReceipts'

const t = () =>
  new DeliveryTracker(
    async () => {},
    () => 1,
    3,
  )

describe('DeliveryTracker', () => {
  it('delivers on 2xx', async () => {
    const r = await t().deliver('a', 'webhook', async () => ({ ok: true, status: 204 }))
    expect(r.status).toBe('delivered')
    expect(r.attemptHistory).toEqual([{ attempt: 1, status: 'delivered', updatedAt: 1 }])
  })
  it('retries non-2xx then dead-letters and flags channel', async () => {
    const tr = t()
    let calls = 0
    for (const id of ['a', 'b', 'c']) await tr.deliver(id, 'webhook', async () => (calls++, { ok: false, status: 500 }))
    expect(calls).toBe(9)
    expect(tr.getDeadLetters()).toHaveLength(3)
    expect(tr.getDeadLetters()[0].lastError).toBe('HTTP 500')
    expect(tr.getDeadLetters()[0].attemptHistory).toEqual([
      { attempt: 1, status: 'failed', error: 'HTTP 500', updatedAt: 1 },
      { attempt: 2, status: 'failed', error: 'HTTP 500', updatedAt: 1 },
      { attempt: 3, status: 'failed', error: 'HTTP 500', updatedAt: 1 },
    ])
    expect(tr.getFailingChannels()).toEqual(['webhook'])
  })
  it('recovers after a retry', async () => {
    let n = 0
    const r = await t().deliver('a', 'email', async () => {
      const status = ++n < 2 ? 503 : 200
      return { ok: status === 200, status }
    })
    expect(r.status).toBe('delivered')
    expect(r.attempts).toBe(2)
    expect(r.attemptHistory.map(({ attempt, status, error }) => ({ attempt, status, error }))).toEqual([
      { attempt: 1, status: 'failed', error: 'HTTP 503' },
      { attempt: 2, status: 'delivered', error: undefined },
    ])
    expect(backoffMs(3)).toBe(2000)
  })

  it('records thrown network failures before a successful retry', async () => {
    let calls = 0
    const r = await t().deliver('a', 'email', async () => {
      if (calls++ === 0) throw new Error('Network unavailable')
      return { ok: true, status: 200 }
    })

    expect(r.status).toBe('delivered')
    expect(r.attemptHistory.map(({ status, error }) => ({ status, error }))).toEqual([
      { status: 'failed', error: 'Network unavailable' },
      { status: 'delivered', error: undefined },
    ])
  })
})
