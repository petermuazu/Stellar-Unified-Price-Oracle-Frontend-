import { describe, expect, it } from 'vitest'
import type { MoveAttribution } from '../types'
import { buildConfidenceRegimeSummaries } from './confidenceRegimes'

function tick(deltaPercent: number | null, confidence: number, timestamp: number): MoveAttribution {
  return {
    assetPair: 'BTC/USD',
    timestamp,
    price: 100,
    confidence,
    previousConfidence: null,
    delta: null,
    deltaPercent,
    sources: [],
    leadingSources: [],
  }
}

describe('buildConfidenceRegimeSummaries', () => {
  it('breaks down confidence by relative volatility regime for each asset', () => {
    const history = new Map([
      [
        'BTC/USD',
        [tick(null, 0.9, 1), tick(0.1, 0.8, 2), tick(0.2, 0.7, 3), tick(3, 0.6, 4), tick(-4, 0.5, 5), tick(8, 0.4, 6)],
      ],
    ])

    const [summary] = buildConfidenceRegimeSummaries(history)

    expect(summary.assetPair).toBe('BTC/USD')
    expect(summary.regimes.map((regime) => regime.regime)).toEqual(['low', 'moderate', 'high'])
    expect(summary.regimes.reduce((sum, regime) => sum + regime.sampleCount, 0)).toBe(4)
    expect(summary.regimes[0].meanConfidence).toBeGreaterThan(summary.regimes[2].meanConfidence)
  })

  it('omits summaries without enough returns and confidence samples', () => {
    expect(buildConfidenceRegimeSummaries(new Map([['BTC/USD', [tick(null, 0.9, 1), tick(1, 0.8, 2)]]]))).toEqual([])
  })

  it('sorts assets and ignores invalid confidence values', () => {
    const makeHistory = (pair: string, confidence: number) =>
      Array.from({ length: 5 }, (_, index) => ({
        ...tick(index === 0 ? null : index, confidence, index + 1),
        assetPair: pair,
      }))
    const summaries = buildConfidenceRegimeSummaries(
      new Map([
        ['XLM/USD', makeHistory('XLM/USD', 0.8)],
        ['BTC/USD', makeHistory('BTC/USD', 1.4)],
      ]),
    )

    expect(summaries.map(({ assetPair }) => assetPair)).toEqual(['XLM/USD'])
  })
})
