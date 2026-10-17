import { describe, expect, it } from 'vitest'
import type { ValuedHolding } from './portfolio'
import { modelPortfolioScenario } from './portfolioScenario'

const holdings: ValuedHolding[] = [
  {
    id: 'xlm',
    assetPair: 'XLM/USD',
    amount: 100,
    baseAsset: 'XLM',
    quoteAsset: 'USD',
    price: 0.12,
    value: 12,
    status: 'available',
    sources: ['band', 'chainlink'],
  },
  {
    id: 'eth',
    assetPair: 'ETH/EUR',
    amount: 2,
    baseAsset: 'ETH',
    quoteAsset: 'EUR',
    price: 2_500,
    value: 5_000,
    status: 'available',
    sources: ['redstone'],
  },
  {
    id: 'stale',
    assetPair: 'BTC/USD',
    amount: 1,
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    price: null,
    value: null,
    status: 'stale',
    sources: ['chainlink'],
  },
]

describe('modelPortfolioScenario', () => {
  it('reports current source-dependent notional and an explicit assumed adverse spread stress', () => {
    expect(modelPortfolioScenario(holdings, 'chainlink', 5)).toEqual({
      providerExposure: [{ quoteAsset: 'USD', amount: 12 }],
      spreadStressLoss: [
        { quoteAsset: 'EUR', amount: 250 },
        { quoteAsset: 'USD', amount: 0.6 },
      ],
      valuedHoldingCount: 2,
      excludedHoldingCount: 1,
    })
  })

  it('does not assign a price impact to an outage when no priced holding lists the provider', () => {
    const result = modelPortfolioScenario(holdings, 'reflector', 0)
    expect(result.providerExposure).toEqual([])
    expect(result.spreadStressLoss.every(({ amount }) => amount === 0)).toBe(true)
  })
})
