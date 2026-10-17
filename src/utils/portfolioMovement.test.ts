import { describe, expect, it } from 'vitest'
import { calculatePortfolioMovement } from './portfolioMovement'

describe('calculatePortfolioMovement', () => {
  it('compares the current feed price with the oldest available history point', () => {
    const movement = calculatePortfolioMovement(
      [
        { price: 0.1, timestamp: 1_000 },
        { price: 0.11, timestamp: 2_000 },
      ],
      0.12,
    )

    expect(movement).not.toBeNull()
    expect(movement).toMatchObject({
      baselinePrice: 0.1,
      baselineTimestamp: 1_000,
      currentPrice: 0.12,
    })
    expect(movement?.change).toBeCloseTo(0.02)
    expect(movement?.changePercent).toBeCloseTo(20)
  })

  it('returns unavailable when history, a positive baseline, or a current price is missing', () => {
    expect(calculatePortfolioMovement([], 2)).toBeNull()
    expect(calculatePortfolioMovement([{ price: 0, timestamp: 1_000 }], 2)).toBeNull()
    expect(calculatePortfolioMovement([{ price: 1, timestamp: 1_000 }], null)).toBeNull()
  })
})
