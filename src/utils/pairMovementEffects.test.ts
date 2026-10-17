import { describe, expect, it } from 'vitest'
import type { PriceHistoryEntry } from '../types'
import { calculatePairMovementEffects } from './pairMovementEffects'

function entry(price: number, timestamp: number): PriceHistoryEntry {
  return { price, timestamp, confidence: 0.9, sources: ['chainlink'] }
}

describe('calculatePairMovementEffects', () => {
  it('separates the base movement from the USD quote numeraire', () => {
    const result = calculatePairMovementEffects('XLM/USD', [entry(0.1, 1), entry(0.11, 2)], 10, 2)

    expect(result).toMatchObject({
      status: 'available',
      baseAsset: 'XLM',
      quoteAsset: 'USD',
      previousTimestamp: 1,
      timestamp: 2,
      baseEffectLogPercent: expect.closeTo(100 * Math.log(1.1)),
      quoteEffectLogPercent: 0,
      pairMoveLogPercent: expect.closeTo(100 * Math.log(1.1)),
      stale: false,
    })
  })

  it('marks the latest observation stale without suppressing its actual effect', () => {
    const result = calculatePairMovementEffects('BTC/USD', [entry(10, 1), entry(12, 2)], 1, 10)

    expect(result.status).toBe('available')
    if (result.status === 'available') {
      expect(result.stale).toBe(true)
      expect(result.pairMoveLogPercent).toBeCloseTo(100 * Math.log(1.2))
    }
  })

  it.each([
    ['BTC/EUR', [entry(1, 1), entry(2, 2)], 'unsupported-pair'],
    ['BTC/USD', [entry(1, 1)], 'insufficient-history'],
    ['BTC/USD', [entry(1, 1), entry(0, 2)], 'invalid-price'],
    ['BTC', [entry(1, 1), entry(2, 2)], 'unsupported-pair'],
  ] as const)('reports %s as unavailable when %s occurs', (pair, history, reason) => {
    expect(calculatePairMovementEffects(pair, history).status).toBe('unavailable')
    expect(calculatePairMovementEffects(pair, history)).toEqual({ status: 'unavailable', reason })
  })
})
