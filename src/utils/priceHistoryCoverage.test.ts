import { describe, expect, it } from 'vitest'
import { buildSourceCoverageData } from './priceHistoryCoverage'

describe('buildSourceCoverageData', () => {
  it('calculates coverage only from contributors reported on each point', () => {
    const { series, points } = buildSourceCoverageData([
      { price: 10, timestamp: 1, confidence: 0.9, sources: ['chainlink', 'redstone'] },
      { price: 11, timestamp: 2, confidence: 0.9, sources: ['chainlink'] },
      { price: 12, timestamp: 3, confidence: 0.9, sources: [] },
    ])

    expect(series).toEqual([
      { source: 'chainlink', dataKey: 'sourceCoverage0', coveredPoints: 2, totalPoints: 3, percent: (2 / 3) * 100 },
      { source: 'redstone', dataKey: 'sourceCoverage1', coveredPoints: 1, totalPoints: 3, percent: (1 / 3) * 100 },
    ])
    expect(points.map((point) => [point.sourceCoverage0, point.sourceCoverage1])).toEqual([
      [100, 100],
      [100, 0],
      [0, 0],
    ])
  })

  it('returns no overlay series when no source contributor metadata exists', () => {
    expect(buildSourceCoverageData([{ price: 10, timestamp: 1, confidence: 0.9, sources: [] }])).toEqual({
      series: [],
      points: [{ price: 10, timestamp: 1, confidence: 0.9, sources: [] }],
    })
  })
})
