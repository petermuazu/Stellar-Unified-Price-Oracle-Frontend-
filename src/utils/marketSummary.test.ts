import { describe, expect, it } from 'vitest'
import type { PriceData } from '../types'
import { buildMarketSummary } from './marketSummary'

const now = Date.UTC(2026, 0, 1)

const price: PriceData = {
  assetPair: 'XLM/USD',
  price: 0.25,
  timestamp: now - 60_000,
  confidence: 0.98,
  sources: ['chainlink', 'reflector'],
}

describe('buildMarketSummary', () => {
  it('includes source attribution, original timestamps, confidence, and freshness', () => {
    expect(buildMarketSummary([price], now, 120_000)).toEqual({
      schemaVersion: 1,
      generatedAt: new Date(now).toISOString(),
      staleThresholdMs: 120_000,
      assets: [
        {
          assetPair: 'XLM/USD',
          price: 0.25,
          confidence: 0.98,
          sources: ['chainlink', 'reflector'],
          timestamp: now - 60_000,
          observedAt: new Date(now - 60_000).toISOString(),
          ageMs: 60_000,
          stale: false,
        },
      ],
    })
  })

  it('marks old data stale and treats future timestamps as age zero', () => {
    const summary = buildMarketSummary(
      [price, { ...price, assetPair: 'BTC/USD', timestamp: now + 10_000 }],
      now,
      30_000,
    )

    expect(summary.assets[0].stale).toBe(true)
    expect(summary.assets[1].ageMs).toBe(0)
    expect(summary.assets[1].stale).toBe(false)
  })

  it('preserves an empty snapshot instead of inventing assets', () => {
    expect(buildMarketSummary([], now).assets).toEqual([])
  })
})
