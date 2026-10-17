import { describe, expect, it } from 'vitest'
import { getSourceTimestampState, SOURCE_TIMESTAMP_STALE_THRESHOLD_MS } from './sourceTimestamps'

describe('getSourceTimestampState', () => {
  it('marks a timestamp within the freshness tolerance as available', () => {
    expect(getSourceTimestampState({ source: 'chainlink', timestamp: 90_000 }, 100_000)).toBe('available')
  })

  it('marks a timestamp older than the one-minute tolerance as stale', () => {
    expect(
      getSourceTimestampState(
        { source: 'chainlink', timestamp: 100_000 - SOURCE_TIMESTAMP_STALE_THRESHOLD_MS - 1 },
        100_000,
      ),
    ).toBe('stale')
  })

  it('marks missing or invalid timestamps as unavailable', () => {
    expect(getSourceTimestampState(undefined, 100_000)).toBe('unavailable')
    expect(getSourceTimestampState({ source: 'chainlink', timestamp: -1 }, 100_000)).toBe('unavailable')
  })
})
