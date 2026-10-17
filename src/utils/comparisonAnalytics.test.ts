import { describe, expect, it } from 'vitest'
import type { PriceHistoryEntry } from '../types'
import {
  alignPriceHistories,
  calculatePeriodPerformance,
  calculateReturns,
  calculateReturnCorrelation,
  calculateRollingBeta,
  calculateVolatilityRegimes,
  groupVolatilityRegimes,
} from './comparisonAnalytics'

function entry(timestamp: number, price: number): PriceHistoryEntry {
  return { timestamp, price, confidence: 1, sources: [] }
}

describe('comparison analytics', () => {
  it('aligns only valid observations inside inclusive interval boundaries', () => {
    const asset = [entry(0, 10), entry(1000, 12), entry(2000, 15), entry(3000, 0)]
    const benchmark = [entry(0, 20), entry(1000, 24), entry(2000, 30), entry(3000, 40)]
    expect(alignPriceHistories(asset, benchmark, 1000, 2000)).toEqual([
      { timestamp: 1000, price: 12, benchmarkPrice: 24 },
      { timestamp: 2000, price: 15, benchmarkPrice: 30 },
    ])
    expect(alignPriceHistories(asset, benchmark, 2000, 1000)).toEqual([])
  })

  it('reports endpoint absolute changes and relative returns without interpolation', () => {
    const points = [
      { timestamp: 10, price: 100, benchmarkPrice: 50 },
      { timestamp: 20, price: 125, benchmarkPrice: 60 },
    ]
    const result = calculatePeriodPerformance(points)
    expect(result?.asset).toEqual({ absoluteChange: 25, returnPercent: 25 })
    expect(result?.benchmark.absoluteChange).toBe(10)
    expect(result?.benchmark.returnPercent).toBeCloseTo(20)
    expect(calculatePeriodPerformance(points.slice(0, 1))).toBeNull()
  })

  it('calculates correlation and rolling beta from paired simple returns', () => {
    const points = [
      { timestamp: 1, price: 100, benchmarkPrice: 100 },
      { timestamp: 2, price: 110, benchmarkPrice: 105 },
      { timestamp: 3, price: 99, benchmarkPrice: 99.75 },
      { timestamp: 4, price: 108.9, benchmarkPrice: 104.7375 },
      { timestamp: 5, price: 98.01, benchmarkPrice: 99.500625 },
    ]
    const returns = calculateReturns(points)
    expect(calculateReturnCorrelation(returns)).toBeCloseTo(1)
    expect(calculateRollingBeta(returns, 2)).toHaveLength(3)
    expect(calculateRollingBeta(returns, 2)[0].beta).toBeCloseTo(2)
    expect(calculateRollingBeta(returns, 6)).toEqual([])
    expect(calculateRollingBeta([{ timestamp: 1, assetReturn: 0.1, benchmarkReturn: 0 }], 1)).toEqual([])
  })

  it('withholds beta when benchmark returns have no variance', () => {
    expect(
      calculateRollingBeta(
        [
          { timestamp: 1, assetReturn: 0.1, benchmarkReturn: 0.02 },
          { timestamp: 2, assetReturn: 0.2, benchmarkReturn: 0.02 },
        ],
        2,
      )[0].beta,
    ).toBeNaN()
  })

  it('classifies relative volatility and groups consecutive regimes', () => {
    let price = 100
    const history = Array.from({ length: 24 }, (_, index) => {
      if (index > 0) {
        const change = index < 8 ? 0.001 : index < 16 ? 0.01 : 0.04
        price *= 1 + change
      }
      return entry(index * 1000, price)
    })
    const regimes = calculateVolatilityRegimes(history, 0, 23_000, 5)
    expect(regimes.length).toBeGreaterThan(0)
    expect(regimes.every((point) => Number.isFinite(point.volatility))).toBe(true)
    expect(groupVolatilityRegimes(regimes).length).toBeGreaterThan(0)
    expect(calculateVolatilityRegimes(history, 0, 23_000, 30)).toEqual([])
  })
})
