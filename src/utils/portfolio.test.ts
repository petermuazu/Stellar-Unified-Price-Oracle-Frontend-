import { describe, expect, it } from 'vitest'
import type { PriceData } from '../types/price'
import { isPortfolioHolding, valuePortfolio } from './portfolio'

const prices: PriceData[] = [
  { assetPair: 'XLM/USD', price: 0.12, timestamp: 1_000, confidence: 0.99, sources: ['band'] },
  { assetPair: 'BTC/USD', price: 50_000, timestamp: 1_000, confidence: 0.99, sources: ['chainlink'] },
  { assetPair: 'ETH/EUR', price: 2_500, timestamp: 1_000, confidence: 0.99, sources: ['redstone'] },
]

describe('portfolio valuation', () => {
  it('groups base units and available quote value across holdings', () => {
    const result = valuePortfolio(
      [
        { id: '1', assetPair: 'XLM/USD', amount: 100 },
        { id: '2', assetPair: 'XLM/USD', amount: 50 },
        { id: '3', assetPair: 'ETH/EUR', amount: 2 },
      ],
      prices,
      1_000,
    )

    expect(result.baseExposure).toEqual([
      { asset: 'ETH', amount: 2 },
      { asset: 'XLM', amount: 150 },
    ])
    expect(result.quoteExposure).toEqual([
      { asset: 'EUR', amount: 5_000 },
      { asset: 'USD', amount: 18 },
    ])
    expect(result.totalQuoteValue).toBe(5_018)
  })

  it('does not value missing, stale, or future prices', () => {
    const result = valuePortfolio(
      [
        { id: 'missing', assetPair: 'DOGE/USD', amount: 10 },
        { id: 'stale', assetPair: 'XLM/USD', amount: 100 },
      ],
      prices,
      200_000,
    )

    expect(result.totalQuoteValue).toBe(0)
    expect(result.unavailableCount).toBe(1)
    expect(result.staleCount).toBe(1)
    expect(result.holdings.map(({ status }) => status)).toEqual(['unavailable', 'stale'])
  })

  it('rejects malformed persisted positions', () => {
    expect(isPortfolioHolding({ id: 'x', assetPair: 'bad pair', amount: 2 })).toBe(false)
    expect(isPortfolioHolding({ id: 'x', assetPair: 'XLM/USD', amount: Infinity })).toBe(false)
    expect(isPortfolioHolding({ id: 'x', assetPair: 'XLM/USD', amount: 0 })).toBe(false)
  })
})
