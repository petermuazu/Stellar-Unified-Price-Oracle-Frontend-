import type { PriceHistoryEntry } from '../types'

export interface PriceHistoryGap {
  startTimestamp: number
  endTimestamp: number
  elapsedMs: number
  expectedIntervalMs: number
}

/**
 * Infer unusually long intervals from observed history timestamps.
 * This reports potential gaps only; it never creates price samples.
 */
export function findPriceHistoryGaps(history: PriceHistoryEntry[]): PriceHistoryGap[] {
  const timestamps = [...new Set(history.map((entry) => entry.timestamp))].filter(Number.isFinite).sort((a, b) => a - b)
  const intervals = timestamps.slice(1).map((timestamp, index) => timestamp - timestamps[index])
  if (intervals.length < 2) return []

  const sortedIntervals = [...intervals].sort((a, b) => a - b)
  const typicalIntervals = sortedIntervals.slice(0, Math.ceil(sortedIntervals.length / 2))
  const middle = Math.floor(typicalIntervals.length / 2)
  const expectedIntervalMs =
    typicalIntervals.length % 2 === 0
      ? (typicalIntervals[middle - 1] + typicalIntervals[middle]) / 2
      : typicalIntervals[middle]

  if (expectedIntervalMs <= 0) return []

  return intervals.flatMap((elapsedMs, index) =>
    elapsedMs > expectedIntervalMs * 2.5
      ? [
          {
            startTimestamp: timestamps[index],
            endTimestamp: timestamps[index + 1],
            elapsedMs,
            expectedIntervalMs,
          },
        ]
      : [],
  )
}
