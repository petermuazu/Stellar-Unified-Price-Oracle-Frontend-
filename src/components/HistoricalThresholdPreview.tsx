import { useMemo, useState } from 'react'
import { usePriceHistory } from '../hooks/usePriceHistory'
import type { ValuedHolding } from '../utils/portfolio'

function formatPrice(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumSignificantDigits: 8 }).format(value)
}

export function HistoricalThresholdPreview({ holdings }: { holdings: readonly ValuedHolding[] }) {
  const pairs = useMemo(() => [...new Set(holdings.map(({ assetPair }) => assetPair))].sort(), [holdings])
  const [selectedPair, setSelectedPair] = useState('')
  const [thresholdInput, setThresholdInput] = useState('3')
  const pair = pairs.includes(selectedPair) ? selectedPair : (pairs[0] ?? null)
  const { history, loading, error } = usePriceHistory(pair, { pageSize: 500, refreshInterval: 0 })
  const threshold = Number(thresholdInput)
  const validThreshold =
    thresholdInput.trim() !== '' && Number.isFinite(threshold) && threshold >= 0.1 && threshold <= 10
  const first = history[0]
  const last = history[history.length - 1]

  return (
    <section
      aria-labelledby="historical-threshold-title"
      className="rounded-xl border border-gray-200 dark:border-gray-800"
    >
      <div className="bg-gray-50 p-4 dark:bg-gray-900">
        <h2 id="historical-threshold-title" className="font-semibold text-gray-900 dark:text-white">
          Historical aggregation-threshold preview
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
          Choose an outlier z-score threshold to stage a preview. Historical source-level observations are not currently
          returned by the API, so this frontend cannot recalculate or claim a changed price.
        </p>
      </div>
      {pairs.length === 0 ? (
        <p className="p-4 text-sm text-gray-600 dark:text-gray-400">
          Add a holding to select a pair with historical prices.
        </p>
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Asset pair
            <select
              value={pair ?? ''}
              onChange={(event) => setSelectedPair(event.target.value)}
              className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 focus-visible:outline-2 focus-visible:outline-cyan-600 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              {pairs.map((assetPair) => (
                <option key={assetPair} value={assetPair}>
                  {assetPair}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Candidate z-score threshold
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={thresholdInput}
              onChange={(event) => setThresholdInput(event.target.value)}
              aria-describedby={validThreshold ? 'threshold-preview-note' : 'threshold-preview-error'}
              className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 focus-visible:outline-2 focus-visible:outline-cyan-600 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </label>
          {!validThreshold && (
            <p id="threshold-preview-error" role="alert" className="text-sm text-red-700 dark:text-red-300">
              Enter a finite z-score threshold from 0.1 to 10.
            </p>
          )}
          <div id="threshold-preview-note" className="sm:col-span-2">
            {loading && history.length === 0 ? (
              <p role="status" className="text-sm text-gray-600 dark:text-gray-400">
                Loading historical aggregate prices for {pair}…
              </p>
            ) : error && history.length === 0 ? (
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                Historical prices could not be loaded. No preview has been calculated.
              </p>
            ) : history.length === 0 ? (
              <p role="status" className="text-sm text-gray-600 dark:text-gray-400">
                No historical aggregate prices are available for {pair}.
              </p>
            ) : (
              <>
                <p
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="text-sm text-gray-900 dark:text-white"
                >
                  Candidate threshold: {validThreshold ? threshold : 'invalid'} z-score. Recalculated historical prices
                  are unavailable; the candidate has not been applied.
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Existing baseline only: {history.length} aggregate points, from {formatPrice(first.price)} at{' '}
                  {new Date(first.timestamp).toLocaleString()} to {formatPrice(last.price)} at{' '}
                  {new Date(last.timestamp).toLocaleString()}.
                </p>
                {error && (
                  <p role="status" className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                    Refresh failed; baseline uses the last available history response.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
