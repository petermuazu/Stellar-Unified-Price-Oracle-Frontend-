import { describe, expect, it } from 'vitest'
import { findPriceHistoryGaps } from './priceHistoryGaps'

function historyAt(...timestamps: number[]) {
  return timestamps.map((timestamp) => ({ timestamp, price: 1, confidence: 1, sources: ['chainlink'] }))
}

describe('findPriceHistoryGaps', () => {
  it('identifies intervals much longer than the observed cadence', () => {
    expect(findPriceHistoryGaps(historyAt(0, 10_000, 20_000, 120_000, 130_000))).toEqual([
      {
        startTimestamp: 20_000,
        endTimestamp: 120_000,
        elapsedMs: 100_000,
        expectedIntervalMs: 10_000,
      },
    ])
  })

  it('does not flag regular sampling or histories with too few intervals', () => {
    expect(findPriceHistoryGaps(historyAt(0, 10_000, 20_000, 30_000))).toEqual([])
    expect(findPriceHistoryGaps(historyAt(0, 100_000))).toEqual([])
    expect(findPriceHistoryGaps([])).toEqual([])
  })

  it('sorts timestamps and ignores duplicate timestamps without inventing points', () => {
    expect(findPriceHistoryGaps(historyAt(20_000, 0, 10_000, 10_000, 120_000))).toHaveLength(1)
  })
})
