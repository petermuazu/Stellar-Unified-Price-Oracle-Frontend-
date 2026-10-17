import type { ChartAnnotation } from '../components/PriceChart'
import type { PriceHistoryEntry } from '../types'

/** Converts reported historical source exclusions into immutable chart markers. */
export function buildExcludedSourceAnnotations(history: PriceHistoryEntry[]): ChartAnnotation[] {
  return history.flatMap((entry) => {
    const excludedSources = entry.excludedSources ?? []
    const flagged = (['synthetic', 'stale', 'imputed'] as const).filter((flag) => entry.qualityFlags?.[flag] === true)
    if (excludedSources.length === 0 && flagged.length === 0) return []
    const details = [
      ...excludedSources.map(
        (excluded) => `${excluded.source}: ${excluded.reason} (reported ${excluded.reportedPrice})`,
      ),
      ...flagged.map((flag) => `API reported ${flag}`),
    ].join('; ')
    return [
      {
        id: `quality-event-${entry.timestamp}`,
        timestamp: entry.timestamp,
        label: flagged.length > 0 ? `Quality: ${flagged.join(', ')}` : 'Source excluded',
        note: details,
        color: '#f59e0b',
        kind: 'quality',
      },
    ]
  })
}
