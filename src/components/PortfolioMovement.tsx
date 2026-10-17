import { useMemo } from 'react'
import { usePriceHistory } from '../hooks/usePriceHistory'
import { PORTFOLIO_PRICE_STALE_AFTER_MS, type ValuedHolding } from '../utils/portfolio'
import { calculatePortfolioMovement } from '../utils/portfolioMovement'

export function PortfolioMovement({ holdings }: { holdings: readonly ValuedHolding[] }) {
  const pairs = useMemo(() => {
    const byPair = new Map<string, { holding: ValuedHolding; amount: number }>()
    for (const holding of holdings) {
      const existing = byPair.get(holding.assetPair)
      byPair.set(holding.assetPair, {
        holding,
        amount: (existing?.amount ?? 0) + holding.amount,
      })
    }
    return [...byPair.values()]
  }, [holdings])

  return (
    <section
      aria-labelledby="portfolio-movement-title"
      className="rounded-xl border border-gray-200 dark:border-gray-800"
    >
      <div className="bg-gray-50 p-4 dark:bg-gray-900">
        <h2 id="portfolio-movement-title" className="font-semibold text-gray-900 dark:text-white">
          Price movement
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Change since the earliest available history point for each entered holding.
        </p>
      </div>
      {pairs.length === 0 ? (
        <p className="p-4 text-sm text-gray-600 dark:text-gray-400">Add holdings to track their price movement.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {pairs.map(({ holding, amount }) => (
            <MovementRow key={holding.assetPair} holding={holding} amount={amount} />
          ))}
        </ul>
      )}
    </section>
  )
}

function MovementRow({ holding, amount }: { holding: ValuedHolding; amount: number }) {
  const { history, loading, error } = usePriceHistory(holding.assetPair, {
    pageSize: 100,
    refreshInterval: 0,
  })
  const movement = calculatePortfolioMovement(history, holding.price)
  const latestHistory = history[history.length - 1]
  const historyIsStale =
    latestHistory !== undefined && Date.now() - latestHistory.timestamp > PORTFOLIO_PRICE_STALE_AFTER_MS

  let message: string
  if (loading && history.length === 0) {
    message = 'Loading historical prices…'
  } else if (error && history.length === 0) {
    message = 'Historical price data could not be loaded.'
  } else if (!history.length) {
    message = 'No historical price data is available for this pair.'
  } else if (holding.status !== 'available') {
    message =
      holding.status === 'stale'
        ? 'Current price is stale; movement is not calculated.'
        : 'Current price is unavailable; movement is not calculated.'
  } else if (!movement) {
    message = 'Movement is unavailable because a valid positive baseline price is missing.'
  } else {
    message = ''
  }

  return (
    <li className="grid gap-2 p-4 sm:grid-cols-[1fr_2fr] sm:items-center">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white">{holding.assetPair}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {amount} {holding.baseAsset} held
        </p>
      </div>
      <div aria-live="polite" aria-atomic="true">
        {loading && history.length === 0 ? (
          <p role="status" className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        ) : message ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>
              Change:{' '}
              <strong>
                {movement.changePercent > 0 ? '+' : ''}
                {movement.changePercent.toFixed(2)}%
              </strong>
            </span>
            <span>From {new Date(movement.baselineTimestamp).toLocaleString()}</span>
            <span>
              Now {movement.currentPrice} {holding.quoteAsset}
            </span>
          </div>
        )}
        {error && history.length > 0 && (
          <p role="status" className="mt-1 text-xs text-amber-800 dark:text-amber-200">
            Refresh failed; showing the last available history.
          </p>
        )}
        {!message && historyIsStale && (
          <p role="status" className="mt-1 text-xs text-amber-800 dark:text-amber-200">
            Latest history point is stale; treat this movement as delayed.
          </p>
        )}
      </div>
    </li>
  )
}
