import { describe, expect, it } from 'vitest'
import type { PriceData } from '../types'
import {
  calculatePortfolioValuation,
  createPortfolioSnapshot,
  EMPTY_PORTFOLIO,
  PortfolioStoreSchema,
} from './portfolio'

const holdings = [
  { id: 'btc', pair: 'BTC/USD', quantity: 0.5 },
  { id: 'xlm', pair: 'XLM/USD', quantity: 10 },
]

const prices: PriceData[] = [
  { assetPair: 'BTC/USD', price: 60_000, timestamp: 9_900, confidence: 1, sources: ['chainlink'] },
  { assetPair: 'XLM/USD', price: 0.2, timestamp: 9_800, confidence: 1, sources: ['reflector'] },
]

describe('portfolio valuation', () => {
  it('values holdings in USD from actual oracle prices and snapshots rates and timestamps', () => {
    const valuation = calculatePortfolioValuation(holdings, prices, 'USD', 1_000, 10_000)

    expect(valuation.total).toBe(30_002)
    expect(valuation.rows.map((row) => row.value)).toEqual([30_000, 2])
    expect(createPortfolioSnapshot('snapshot-1', 10_000, 'USD', valuation)?.holdings[0]).toMatchObject({
      pair: 'BTC/USD',
      rate: 60_000,
      quoteTimestamp: 9_900,
      sourcePairs: ['BTC/USD'],
    })
  })

  it('converts through real USD quotes and never assumes a stablecoin peg', () => {
    const valuation = calculatePortfolioValuation(holdings, prices, 'XLM', 1_000, 10_000)
    expect(valuation.rows[0].value).toBe(150_000)
    expect(valuation.rows[0].sourcePairs).toEqual(['BTC/USD', 'XLM/USD'])

    const missingUsdcQuote = calculatePortfolioValuation(holdings, prices, 'USDC', 1_000, 10_000)
    expect(missingUsdcQuote.total).toBeNull()
    expect(missingUsdcQuote.rows[0].unavailableReason).toMatch(/USDC\/USD/)
  })

  it('marks stale inputs and refuses a complete total when a quote is unavailable', () => {
    const stale = calculatePortfolioValuation(
      holdings,
      [{ ...prices[0], qualityFlags: { stale: true } }, prices[1]],
      'USD',
      1_000,
      10_000,
    )
    expect(stale.stale).toBe(true)

    const missing = calculatePortfolioValuation(holdings, [prices[0]], 'USD', 1_000, 10_000)
    expect(missing.total).toBeNull()
    expect(createPortfolioSnapshot('snapshot-2', 10_000, 'USD', missing)).toBeNull()
  })

  it('validates persisted portfolio snapshots and handles an empty portfolio', () => {
    expect(PortfolioStoreSchema.safeParse(EMPTY_PORTFOLIO).success).toBe(true)
    expect(
      PortfolioStoreSchema.safeParse({
        ...EMPTY_PORTFOLIO,
        holdings: [{ id: 'bad', pair: 'UNKNOWN/USD', quantity: 1 }],
      }).success,
    ).toBe(false)
    expect(calculatePortfolioValuation([], prices, 'USD', 1_000, 10_000).total).toBeNull()
  })
})
