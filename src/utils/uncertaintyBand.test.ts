import { describe, expect, it } from 'vitest'
import type { MoveAttribution } from '../types'
import { getObservedSourceRange } from './uncertaintyBand'

const attribution: MoveAttribution = {
  assetPair: 'BTC/USD',
  timestamp: 200,
  price: 100,
  confidence: 0.9,
  previousConfidence: 0.8,
  delta: 0,
  deltaPercent: 0,
  sources: [
    { source: 'chainlink', price: 99, priceIsObserved: true, prevPrice: null, delta: null, deltaPercent: null },
    { source: 'redstone', price: 101, priceIsObserved: true, prevPrice: null, delta: null, deltaPercent: null },
    { source: 'band', price: 100, priceIsObserved: false, prevPrice: null, delta: null, deltaPercent: null },
  ],
  leadingSources: [],
}

describe('getObservedSourceRange', () => {
  it('returns the min-max envelope from actual source-reported prices', () => {
    expect(getObservedSourceRange(attribution, 200, 200)).toEqual({
      low: 99,
      high: 101,
      sourceCount: 2,
      timestamp: 200,
    })
  })

  it('does not use stale ticks or aggregate-price fallbacks as source data', () => {
    expect(getObservedSourceRange(attribution, 201, 200)).toBeNull()
    expect(
      getObservedSourceRange(
        { ...attribution, sources: attribution.sources.map((source) => ({ ...source, priceIsObserved: false })) },
        200,
        200,
      ),
    ).toBeNull()
  })

  it('requires at least two observed sources', () => {
    expect(getObservedSourceRange({ ...attribution, sources: attribution.sources.slice(0, 1) }, 200, 200)).toBeNull()
  })

  it('treats old and future source ticks as unavailable', () => {
    expect(getObservedSourceRange(attribution, 200, 200 + 5 * 60_000 + 1)).toBeNull()
    expect(getObservedSourceRange({ ...attribution, timestamp: 201 }, 200, 200)).toBeNull()
  })
})
