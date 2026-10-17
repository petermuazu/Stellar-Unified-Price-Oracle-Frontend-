import type { MoveAttribution } from '../types'

const SOURCE_RANGE_STALE_AFTER_MS = 5 * 60_000

export interface ObservedSourceRange {
  low: number
  high: number
  sourceCount: number
  timestamp: number
}

/**
 * Builds a source-price envelope only from source prices explicitly reported
 * for the same or a newer tick than the aggregate snapshot.
 */
export function getObservedSourceRange(
  attribution: MoveAttribution | undefined,
  aggregateTimestamp: number,
  now: number = Date.now(),
): ObservedSourceRange | null {
  if (
    !attribution ||
    attribution.timestamp < aggregateTimestamp ||
    attribution.timestamp > now ||
    now - attribution.timestamp > SOURCE_RANGE_STALE_AFTER_MS
  ) {
    return null
  }

  const prices = attribution.sources
    .filter((source) => source.priceIsObserved && Number.isFinite(source.price) && source.price > 0)
    .map((source) => source.price)

  if (prices.length < 2) return null

  return {
    low: Math.min(...prices),
    high: Math.max(...prices),
    sourceCount: prices.length,
    timestamp: attribution.timestamp,
  }
}
