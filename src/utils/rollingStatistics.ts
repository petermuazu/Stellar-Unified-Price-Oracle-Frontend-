import type { PriceHistoryEntry } from '../types'

export interface RollingStatistic {
  timestamp: number
  median: number
  low: number
  high: number
  sampleCount: number
}

/**
 * Calculate a trailing median and min/max range for each point, in timestamp
 * order. The first windows use the observations available so far.
 */
export function calculateRollingStatistics(entries: readonly PriceHistoryEntry[], windowSize = 20): RollingStatistic[] {
  if (!Number.isInteger(windowSize) || windowSize < 1) {
    throw new RangeError('windowSize must be a positive integer')
  }

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp)
  return sorted.map((entry, index) => {
    const window = sorted.slice(Math.max(0, index - windowSize + 1), index + 1)
    const values = window.map((point) => point.price).sort((a, b) => a - b)
    const middle = Math.floor(values.length / 2)
    const median = values.length % 2 === 0 ? (values[middle - 1] + values[middle]) / 2 : values[middle]

    return {
      timestamp: entry.timestamp,
      median,
      low: values[0],
      high: values[values.length - 1],
      sampleCount: values.length,
    }
  })
}
