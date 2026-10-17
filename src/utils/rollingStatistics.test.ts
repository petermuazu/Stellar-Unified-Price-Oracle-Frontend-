import { describe, expect, it } from 'vitest'
import type { PriceHistoryEntry } from '../types'
import { calculateRollingStatistics } from './rollingStatistics'

function entry(price: number, timestamp: number): PriceHistoryEntry {
  return { price, timestamp, confidence: 0.9, sources: ['chainlink'] }
}

describe('calculateRollingStatistics', () => {
  it('computes trailing median and min/max bands with expanding initial windows', () => {
    expect(calculateRollingStatistics([entry(4, 1), entry(1, 2), entry(3, 3), entry(8, 4)], 3)).toEqual([
      { timestamp: 1, median: 4, low: 4, high: 4, sampleCount: 1 },
      { timestamp: 2, median: 2.5, low: 1, high: 4, sampleCount: 2 },
      { timestamp: 3, median: 3, low: 1, high: 4, sampleCount: 3 },
      { timestamp: 4, median: 3, low: 1, high: 8, sampleCount: 3 },
    ])
  })

  it('orders results by timestamp without mutating the source history', () => {
    const history = [entry(20, 2), entry(10, 1)]
    const results = calculateRollingStatistics(history)

    expect(results.map((result) => result.timestamp)).toEqual([1, 2])
    expect(history.map((point) => point.timestamp)).toEqual([2, 1])
  })

  it('returns no statistics for empty history and rejects invalid windows', () => {
    expect(calculateRollingStatistics([])).toEqual([])
    expect(() => calculateRollingStatistics([entry(1, 1)], 0)).toThrow(RangeError)
    expect(() => calculateRollingStatistics([entry(1, 1)], 1.5)).toThrow(RangeError)
  })
})
