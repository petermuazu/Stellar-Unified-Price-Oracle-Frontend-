import type { SourceName } from '../types/price'
import type { ValuedHolding } from './portfolio'

export interface QuoteImpact {
  quoteAsset: string
  amount: number
}

export interface PortfolioScenario {
  providerExposure: QuoteImpact[]
  spreadStressLoss: QuoteImpact[]
  valuedHoldingCount: number
  excludedHoldingCount: number
}

export function modelPortfolioScenario(
  holdings: readonly ValuedHolding[],
  provider: SourceName,
  adverseWideningPercent: number,
): PortfolioScenario {
  const providerExposure = new Map<string, number>()
  const spreadStressLoss = new Map<string, number>()
  let valuedHoldingCount = 0
  let excludedHoldingCount = 0

  for (const holding of holdings) {
    if (holding.status !== 'available' || holding.value === null || !Number.isFinite(holding.value)) {
      excludedHoldingCount += 1
      continue
    }

    valuedHoldingCount += 1
    if (holding.sources.includes(provider)) {
      providerExposure.set(holding.quoteAsset, (providerExposure.get(holding.quoteAsset) ?? 0) + holding.value)
    }
    spreadStressLoss.set(
      holding.quoteAsset,
      (spreadStressLoss.get(holding.quoteAsset) ?? 0) + (holding.value * adverseWideningPercent) / 100,
    )
  }

  const toImpacts = (impacts: Map<string, number>) =>
    [...impacts]
      .map(([quoteAsset, amount]) => ({ quoteAsset, amount }))
      .sort((a, b) => a.quoteAsset.localeCompare(b.quoteAsset))

  return {
    providerExposure: toImpacts(providerExposure),
    spreadStressLoss: toImpacts(spreadStressLoss),
    valuedHoldingCount,
    excludedHoldingCount,
  }
}
