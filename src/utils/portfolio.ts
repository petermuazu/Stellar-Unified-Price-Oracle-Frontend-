import type { PriceData } from '../types/price'

export interface PortfolioHolding {
  id: string
  assetPair: string
  amount: number
}

export interface ValuedHolding extends PortfolioHolding {
  baseAsset: string
  quoteAsset: string
  price: number | null
  value: number | null
  status: 'available' | 'stale' | 'unavailable'
  sources: string[]
}

export interface AssetExposure {
  asset: string
  amount: number
}

export interface PortfolioValuation {
  holdings: ValuedHolding[]
  baseExposure: AssetExposure[]
  quoteExposure: AssetExposure[]
  totalQuoteValue: number
  unavailableCount: number
  staleCount: number
}

export const PORTFOLIO_PRICE_STALE_AFTER_MS = 2 * 60 * 1000

export function isPortfolioHolding(value: unknown): value is PortfolioHolding {
  if (!value || typeof value !== 'object') return false
  const holding = value as Record<string, unknown>
  return (
    typeof holding.id === 'string' &&
    typeof holding.assetPair === 'string' &&
    /^[A-Z0-9]{1,12}\/[A-Z0-9]{1,12}$/.test(holding.assetPair) &&
    typeof holding.amount === 'number' &&
    Number.isFinite(holding.amount) &&
    holding.amount > 0
  )
}

export function valuePortfolio(
  positions: readonly PortfolioHolding[],
  prices: readonly PriceData[],
  now = Date.now(),
  staleAfterMs = PORTFOLIO_PRICE_STALE_AFTER_MS,
): PortfolioValuation {
  const pricesByPair = new Map(prices.map((price) => [price.assetPair.toUpperCase(), price]))
  const base = new Map<string, number>()
  const quote = new Map<string, number>()
  let totalQuoteValue = 0
  let unavailableCount = 0
  let staleCount = 0

  const holdings = positions.map((position): ValuedHolding => {
    const [baseAsset, quoteAsset] = position.assetPair.split('/')
    base.set(baseAsset, (base.get(baseAsset) ?? 0) + position.amount)

    const price = pricesByPair.get(position.assetPair.toUpperCase())
    const status = !price
      ? 'unavailable'
      : now - price.timestamp > staleAfterMs || price.timestamp > now
        ? 'stale'
        : 'available'

    if (status === 'unavailable') unavailableCount += 1
    if (status === 'stale') staleCount += 1

    const value = status === 'available' && price ? position.amount * price.price : null
    if (value !== null && Number.isFinite(value)) {
      quote.set(quoteAsset, (quote.get(quoteAsset) ?? 0) + value)
      totalQuoteValue += value
    }

    return {
      ...position,
      baseAsset,
      quoteAsset,
      price: status === 'available' ? (price?.price ?? null) : null,
      value: value !== null && Number.isFinite(value) ? value : null,
      status,
      sources: price?.sources ?? [],
    }
  })

  const toExposures = (exposures: Map<string, number>) =>
    [...exposures].map(([asset, amount]) => ({ asset, amount })).sort((a, b) => a.asset.localeCompare(b.asset))

  return {
    holdings,
    baseExposure: toExposures(base),
    quoteExposure: toExposures(quote),
    totalQuoteValue,
    unavailableCount,
    staleCount,
  }
}
