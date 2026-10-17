export interface MovementSummary {
  baselinePrice: number
  baselineTimestamp: number
  currentPrice: number
  change: number
  changePercent: number
}

export function calculatePortfolioMovement(
  history: readonly { price: number; timestamp: number }[],
  currentPrice: number | null,
): MovementSummary | null {
  const baseline = history[0]
  if (
    !baseline ||
    !Number.isFinite(baseline.price) ||
    baseline.price <= 0 ||
    !Number.isFinite(baseline.timestamp) ||
    currentPrice === null ||
    !Number.isFinite(currentPrice)
  ) {
    return null
  }

  const change = currentPrice - baseline.price
  return {
    baselinePrice: baseline.price,
    baselineTimestamp: baseline.timestamp,
    currentPrice,
    change,
    changePercent: (change / baseline.price) * 100,
  }
}
