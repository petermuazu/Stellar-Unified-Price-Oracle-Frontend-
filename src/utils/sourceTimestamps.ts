import type { SourceTimestamp } from '../types/price'

export const SOURCE_TIMESTAMP_STALE_THRESHOLD_MS = 60_000

export type SourceTimestampState = 'available' | 'stale' | 'unavailable'

export function getSourceTimestampState(
  sourceTimestamp: SourceTimestamp | undefined,
  aggregateTimestamp: number,
): SourceTimestampState {
  if (!sourceTimestamp || !Number.isFinite(sourceTimestamp.timestamp) || sourceTimestamp.timestamp < 0) {
    return 'unavailable'
  }
  if (aggregateTimestamp - sourceTimestamp.timestamp > SOURCE_TIMESTAMP_STALE_THRESHOLD_MS) return 'stale'
  return 'available'
}
