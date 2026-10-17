import type { PriceData } from '../types'

export interface MarketSummaryAsset {
  assetPair: string
  price: number
  confidence: number
  sources: string[]
  timestamp: number
  observedAt: string
  ageMs: number
  stale: boolean
}

export interface MarketSummary {
  schemaVersion: 1
  generatedAt: string
  staleThresholdMs: number
  assets: MarketSummaryAsset[]
}

/** Build an export snapshot from the prices currently displayed by the dashboard. */
export function buildMarketSummary(
  prices: readonly PriceData[],
  generatedAt = Date.now(),
  staleThresholdMs = 5 * 60_000,
): MarketSummary {
  return {
    schemaVersion: 1,
    generatedAt: new Date(generatedAt).toISOString(),
    staleThresholdMs,
    assets: prices.map((price) => {
      const ageMs = Math.max(0, generatedAt - price.timestamp)
      return {
        assetPair: price.assetPair,
        price: price.price,
        confidence: price.confidence,
        sources: [...price.sources],
        timestamp: price.timestamp,
        observedAt: new Date(price.timestamp).toISOString(),
        ageMs,
        stale: ageMs > staleThresholdMs,
      }
    }),
  }
}
