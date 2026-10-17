import type { PriceHistoryEntry } from '../types/price'

export interface SourceCoverageSeries {
  source: string
  dataKey: string
  coveredPoints: number
  totalPoints: number
  percent: number
}

export interface SourceCoveragePoint extends PriceHistoryEntry {
  [key: string]: unknown
}

export interface SourceCoverageData {
  series: SourceCoverageSeries[]
  points: SourceCoveragePoint[]
}

/**
 * Builds observed history-point coverage from API-reported contributors.
 * This measures presence in returned aggregate points, not upstream uptime.
 */
export function buildSourceCoverageData(entries: readonly PriceHistoryEntry[]): SourceCoverageData {
  const sources = [...new Set(entries.flatMap((entry) => entry.sources))].sort()
  const series = sources.map((source, index) => {
    const coveredPoints = entries.reduce((count, entry) => count + Number(entry.sources.includes(source)), 0)
    return {
      source,
      dataKey: `sourceCoverage${index}`,
      coveredPoints,
      totalPoints: entries.length,
      percent: entries.length === 0 ? 0 : (coveredPoints / entries.length) * 100,
    }
  })

  const points = entries.map((entry) => {
    const point: SourceCoveragePoint = { ...entry }
    for (const item of series) point[item.dataKey] = entry.sources.includes(item.source) ? 100 : 0
    return point
  })

  return { series, points }
}
