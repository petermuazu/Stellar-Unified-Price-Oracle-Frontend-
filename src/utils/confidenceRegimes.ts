import type { MoveAttribution } from '../types'

export type VolatilityRegime = 'low' | 'moderate' | 'high'

export interface ConfidenceRegimeSummary {
  regime: VolatilityRegime
  sampleCount: number
  meanConfidence: number
}

export interface AssetConfidenceRegimes {
  assetPair: string
  regimes: ConfidenceRegimeSummary[]
}

interface VolatilityObservation {
  volatility: number
  confidence: number
}

const RETURN_WINDOW_SIZE = 5

/**
 * Summarises observed confidence scores by per-asset relative volatility
 * tertile. This is descriptive, not accuracy calibration: no realised
 * outcomes or ground-truth labels are available in the current API contract.
 */
export function buildConfidenceRegimeSummaries(
  historyByPair: ReadonlyMap<string, MoveAttribution[]>,
): AssetConfidenceRegimes[] {
  const summaries: AssetConfidenceRegimes[] = []

  for (const [assetPair, history] of historyByPair) {
    const returns: number[] = []
    const observations: VolatilityObservation[] = []

    for (const tick of history) {
      if (tick.deltaPercent !== null && Number.isFinite(tick.deltaPercent)) {
        returns.push(tick.deltaPercent)
      }

      if (tick.confidence < 0 || tick.confidence > 1 || !Number.isFinite(tick.confidence) || returns.length < 2) {
        continue
      }

      const recentReturns = returns.slice(-RETURN_WINDOW_SIZE)
      const meanReturn = recentReturns.reduce((sum, value) => sum + value, 0) / recentReturns.length
      const variance = recentReturns.reduce((sum, value) => sum + (value - meanReturn) ** 2, 0) / recentReturns.length

      observations.push({ volatility: Math.sqrt(variance), confidence: tick.confidence })
    }

    if (observations.length < 3) continue

    const ranked = [...observations].sort((a, b) => a.volatility - b.volatility)
    const regimeTotals: Record<VolatilityRegime, { sampleCount: number; confidenceSum: number }> = {
      low: { sampleCount: 0, confidenceSum: 0 },
      moderate: { sampleCount: 0, confidenceSum: 0 },
      high: { sampleCount: 0, confidenceSum: 0 },
    }

    ranked.forEach((observation, index) => {
      const regime = (['low', 'moderate', 'high'] as const)[Math.min(2, Math.floor((index * 3) / ranked.length))]
      regimeTotals[regime].sampleCount += 1
      regimeTotals[regime].confidenceSum += observation.confidence
    })

    summaries.push({
      assetPair,
      regimes: (['low', 'moderate', 'high'] as const).map((regime) => ({
        regime,
        sampleCount: regimeTotals[regime].sampleCount,
        meanConfidence:
          regimeTotals[regime].sampleCount > 0
            ? regimeTotals[regime].confidenceSum / regimeTotals[regime].sampleCount
            : 0,
      })),
    })
  }

  return summaries.sort((a, b) => a.assetPair.localeCompare(b.assetPair))
}
