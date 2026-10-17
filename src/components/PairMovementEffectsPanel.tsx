import type { PriceHistoryEntry } from '../types'
import { calculatePairMovementEffects } from '../utils/pairMovementEffects'

interface PairMovementEffectsPanelProps {
  pair: string
  history: readonly PriceHistoryEntry[]
  loading: boolean
  error: Error | null
  staleThresholdMinutes: number
}

export function PairMovementEffectsPanel({
  pair,
  history,
  loading,
  error,
  staleThresholdMinutes,
}: PairMovementEffectsPanelProps) {
  const effects = calculatePairMovementEffects(pair, history, staleThresholdMinutes * 60_000)

  return (
    <section
      aria-label="Base and quote asset effects"
      className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6"
    >
      <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Pair movement effects</h2>
      {loading && history.length === 0 ? (
        <p className="text-sm text-gray-400" role="status">
          Loading history for movement decomposition…
        </p>
      ) : error && history.length === 0 ? (
        <p className="text-sm text-red-400" role="alert">
          Movement decomposition unavailable: {error.message}
        </p>
      ) : effects.status === 'unavailable' ? (
        <p className="text-sm text-gray-400" role="status">
          {effects.reason === 'unsupported-pair'
            ? `Effects are unavailable for ${pair}. The API must provide synchronized base/USD and quote/USD history before a non-USD pair can be decomposed.`
            : effects.reason === 'insufficient-history'
              ? 'At least two valid historical observations are required to decompose this movement.'
              : 'Movement effects are unavailable because the latest observations contain a non-positive or invalid price.'}
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Log-return percentage points from {new Date(effects.previousTimestamp).toISOString()} to{' '}
            {new Date(effects.timestamp).toISOString()}. USD is the unit quote reference.
          </p>
          {effects.stale && (
            <p className="text-sm text-amber-300 mb-3" role="status">
              The latest historical observation is stale; the displayed decomposition uses the last two available
              observations.
            </p>
          )}
          {error && (
            <p className="text-sm text-amber-300 mb-3" role="alert">
              History refresh failed; using the last available observations: {error.message}
            </p>
          )}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-gray-400">{effects.baseAsset} effect</dt>
              <dd className="font-mono text-gray-100">
                {effects.baseEffectLogPercent >= 0 ? '+' : ''}
                {effects.baseEffectLogPercent.toFixed(4)} pp
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">{effects.quoteAsset} effect</dt>
              <dd className="font-mono text-gray-100">
                {effects.quoteEffectLogPercent >= 0 ? '+' : ''}
                {effects.quoteEffectLogPercent.toFixed(4)} pp
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Pair movement</dt>
              <dd className="font-mono text-gray-100">
                {effects.pairMoveLogPercent >= 0 ? '+' : ''}
                {effects.pairMoveLogPercent.toFixed(4)} pp
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  )
}
