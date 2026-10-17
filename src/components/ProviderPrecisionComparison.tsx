import type { PairMetadata } from '../types'
import { PRICE_AGING_THRESHOLD_MS } from './FreshnessBadge'

interface ProviderPrecisionComparisonProps {
  pair: string
  pairMetadata?: PairMetadata
  sourcePrices?: Record<string, number>
  sourcePriceDecimals?: Record<string, number>
  timestamp: number
}

function scaleComparison(decimalPlaces: number | undefined, canonicalScale: number): string {
  if (decimalPlaces === undefined) return 'Precision unavailable'
  if (decimalPlaces === canonicalScale) return 'Matches canonical scale'
  return decimalPlaces > canonicalScale ? 'Finer than canonical scale' : 'Coarser than canonical scale'
}

function formatAtScale(price: number, scale: number): string {
  return price.toLocaleString('en-US', {
    useGrouping: false,
    minimumFractionDigits: scale,
    maximumFractionDigits: scale,
  })
}

export function ProviderPrecisionComparison({
  pair,
  pairMetadata,
  sourcePrices,
  sourcePriceDecimals,
  timestamp,
}: ProviderPrecisionComparisonProps) {
  const prices = Object.entries(sourcePrices ?? {}).sort(([a], [b]) => a.localeCompare(b))
  const scale = pairMetadata?.priceScale
  const isStale = Date.now() - timestamp >= PRICE_AGING_THRESHOLD_MS

  return (
    <section aria-label={`Provider price precision for ${pair}`}>
      {prices.length === 0 ? (
        <p className="text-sm text-gray-400" role="status">
          Provider prices and precision are unavailable from the API for this snapshot.
        </p>
      ) : scale == null ? (
        <p className="text-sm text-gray-400" role="status">
          Provider prices are available, but cannot be normalized because the canonical price scale is unavailable.
        </p>
      ) : (
        <>
          <p
            className={`text-xs mb-3 ${isStale ? 'text-amber-300' : 'text-gray-500'}`}
            role="status"
            aria-label={isStale ? `Stale provider snapshot for ${pair}` : `Provider snapshot freshness for ${pair}`}
          >
            {isStale ? 'Snapshot is stale. ' : ''}
            Values are displayed at the API-provided canonical scale ({scale} decimal places). Snapshot:{' '}
            {new Date(timestamp).toLocaleString()}. Provider-specific timestamps are not supplied.
          </p>
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[440px] text-sm text-gray-300"
              aria-label={`${pair} normalized provider prices`}
            >
              <thead className="bg-gray-800 text-xs text-gray-400">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left">
                    Provider
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    Price at canonical scale
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    Reported decimal places
                  </th>
                  <th scope="col" className="px-3 py-2 text-left">
                    Precision
                  </th>
                </tr>
              </thead>
              <tbody>
                {prices.map(([provider, price]) => {
                  const decimalPlaces = sourcePriceDecimals?.[provider]
                  return (
                    <tr key={provider} className="border-t border-gray-800">
                      <th scope="row" className="px-3 py-2 text-left font-medium">
                        {provider}
                      </th>
                      <td className="px-3 py-2 text-right font-mono">{formatAtScale(price, scale)}</td>
                      <td className="px-3 py-2 text-right font-mono">{decimalPlaces ?? 'Unavailable'}</td>
                      <td className="px-3 py-2">{scaleComparison(decimalPlaces, scale)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
