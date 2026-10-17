import type { PriceHistoryEntry } from '../types'
import { pearsonCorrelation } from './correlation'

export interface AlignedPricePoint {
  timestamp: number
  price: number
  benchmarkPrice: number
}

export interface ReturnPoint {
  timestamp: number
  assetReturn: number
  benchmarkReturn: number
}

export interface PeriodPerformance {
  absoluteChange: number
  returnPercent: number
}

export interface VolatilityPoint {
  timestamp: number
  volatility: number
  regime: 'low' | 'normal' | 'high'
}

export interface VolatilityRegime {
  start: number
  end: number
  regime: VolatilityPoint['regime']
}

function validHistory(history: PriceHistoryEntry[]): PriceHistoryEntry[] {
  return history
    .filter((entry) => Number.isFinite(entry.timestamp) && Number.isFinite(entry.price) && entry.price > 0)
    .sort((a, b) => a.timestamp - b.timestamp)
}

/** Aligns positive prices at or inside inclusive Unix-millisecond boundaries. */
export function alignPriceHistories(
  history: PriceHistoryEntry[],
  benchmarkHistory: PriceHistoryEntry[],
  start = -Infinity,
  end = Infinity,
): AlignedPricePoint[] {
  if (start > end) return []
  const asset = validHistory(history).filter((entry) => entry.timestamp >= start && entry.timestamp <= end)
  const benchmark = validHistory(benchmarkHistory).filter((entry) => entry.timestamp >= start && entry.timestamp <= end)
  const used = new Set<number>()
  const aligned: AlignedPricePoint[] = []
  for (const point of asset) {
    let bestIndex = -1
    let bestDistance = 60_001
    for (let index = 0; index < benchmark.length; index++) {
      if (used.has(index)) continue
      const distance = Math.abs(benchmark[index].timestamp - point.timestamp)
      if (distance <= 60_000 && distance < bestDistance) {
        bestIndex = index
        bestDistance = distance
      }
    }
    if (bestIndex >= 0) {
      used.add(bestIndex)
      aligned.push({
        timestamp: point.timestamp,
        price: point.price,
        benchmarkPrice: benchmark[bestIndex].price,
      })
    }
  }
  return aligned
}

export function calculateReturns(points: AlignedPricePoint[]): ReturnPoint[] {
  const returns: ReturnPoint[] = []
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1]
    const current = points[index]
    if (previous.price <= 0 || previous.benchmarkPrice <= 0) continue
    returns.push({
      timestamp: current.timestamp,
      assetReturn: current.price / previous.price - 1,
      benchmarkReturn: current.benchmarkPrice / previous.benchmarkPrice - 1,
    })
  }
  return returns
}

export function calculatePeriodPerformance(
  points: AlignedPricePoint[],
): { asset: PeriodPerformance; benchmark: PeriodPerformance } | null {
  if (points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]
  return {
    asset: {
      absoluteChange: last.price - first.price,
      returnPercent: (last.price / first.price - 1) * 100,
    },
    benchmark: {
      absoluteChange: last.benchmarkPrice - first.benchmarkPrice,
      returnPercent: (last.benchmarkPrice / first.benchmarkPrice - 1) * 100,
    },
  }
}

export function calculateReturnCorrelation(points: ReturnPoint[]): number {
  return pearsonCorrelation(
    points.map((point) => point.assetReturn),
    points.map((point) => point.benchmarkReturn),
  )
}

export function calculateRollingBeta(
  points: ReturnPoint[],
  window: number,
): Array<{ timestamp: number; beta: number }> {
  if (!Number.isInteger(window) || window < 2 || points.length < window) return []
  const result: Array<{ timestamp: number; beta: number }> = []
  for (let end = window; end <= points.length; end++) {
    const sample = points.slice(end - window, end)
    const benchmarkMean = sample.reduce((sum, point) => sum + point.benchmarkReturn, 0) / window
    const assetMean = sample.reduce((sum, point) => sum + point.assetReturn, 0) / window
    let covariance = 0
    let benchmarkVariance = 0
    for (const point of sample) {
      const benchmarkDelta = point.benchmarkReturn - benchmarkMean
      covariance += (point.assetReturn - assetMean) * benchmarkDelta
      benchmarkVariance += benchmarkDelta * benchmarkDelta
    }
    result.push({
      timestamp: sample[window - 1].timestamp,
      beta: benchmarkVariance === 0 ? NaN : covariance / benchmarkVariance,
    })
  }
  return result
}

function sampleDeviation(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1))
}

/** Classifies rolling simple-return volatility into relative tertiles of the selected period. */
export function calculateVolatilityRegimes(
  history: PriceHistoryEntry[],
  start: number,
  end: number,
  window = 10,
): VolatilityPoint[] {
  if (!Number.isInteger(window) || window < 2 || start > end) return []
  const entries = validHistory(history).filter((entry) => entry.timestamp >= start && entry.timestamp <= end)
  const returns: Array<{ timestamp: number; value: number }> = []
  for (let index = 1; index < entries.length; index++) {
    const previous = entries[index - 1]
    returns.push({ timestamp: entries[index].timestamp, value: entries[index].price / previous.price - 1 })
  }
  if (returns.length < window) return []

  const samples = returns.map((point, index) => ({
    timestamp: point.timestamp,
    volatility:
      index + 1 < window
        ? NaN
        : sampleDeviation(returns.slice(index + 1 - window, index + 1).map((item) => item.value)),
  }))
  const valid = samples.filter((sample) => Number.isFinite(sample.volatility))
  const ordered = valid.map((sample) => sample.volatility).sort((a, b) => a - b)
  const lowerThreshold = ordered[Math.floor((ordered.length - 1) / 3)]
  const upperThreshold = ordered[Math.floor(((ordered.length - 1) * 2) / 3)]
  if (lowerThreshold === undefined || upperThreshold === undefined || lowerThreshold === upperThreshold) {
    return valid.map(({ timestamp, volatility }) => ({ timestamp, volatility, regime: 'normal' }))
  }
  return valid.map(({ timestamp, volatility }) => ({
    timestamp,
    volatility,
    regime: volatility <= lowerThreshold ? 'low' : volatility >= upperThreshold ? 'high' : 'normal',
  }))
}

export function groupVolatilityRegimes(points: VolatilityPoint[]): VolatilityRegime[] {
  const regimes: VolatilityRegime[] = []
  for (const point of points) {
    const current = regimes[regimes.length - 1]
    if (current?.regime === point.regime) {
      current.end = point.timestamp
    } else {
      regimes.push({ start: point.timestamp, end: point.timestamp, regime: point.regime })
    }
  }
  return regimes
}
