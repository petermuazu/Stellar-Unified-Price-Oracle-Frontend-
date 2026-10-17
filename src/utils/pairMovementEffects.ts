import type { PriceHistoryEntry } from '../types'

export type PairMovementEffects =
  | {
      status: 'available'
      baseAsset: string
      quoteAsset: string
      previousTimestamp: number
      timestamp: number
      baseEffectLogPercent: number
      quoteEffectLogPercent: number
      pairMoveLogPercent: number
      stale: boolean
    }
  | {
      status: 'unavailable'
      reason: 'unsupported-pair' | 'insufficient-history' | 'invalid-price'
    }

/**
 * Decompose the latest movement for USD-quoted pairs into log-return effects.
 * USD is treated as the quote numeraire (unit value); other quote assets need
 * synchronized base/USD and quote/USD observations from the API.
 */
export function calculatePairMovementEffects(
  pair: string,
  history: readonly PriceHistoryEntry[],
  staleThresholdMs = 5 * 60_000,
  now = Date.now(),
): PairMovementEffects {
  const parts = pair.split('/')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { status: 'unavailable', reason: 'unsupported-pair' }
  }

  const [baseAsset, quoteAsset] = parts
  if (quoteAsset !== 'USD') {
    return { status: 'unavailable', reason: 'unsupported-pair' }
  }

  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp)
  if (sorted.length < 2) {
    return { status: 'unavailable', reason: 'insufficient-history' }
  }

  const previous = sorted[sorted.length - 2]
  const current = sorted[sorted.length - 1]
  if (
    !Number.isFinite(previous.price) ||
    !Number.isFinite(current.price) ||
    previous.price <= 0 ||
    current.price <= 0
  ) {
    return { status: 'unavailable', reason: 'invalid-price' }
  }

  const pairMoveLogPercent = 100 * (Math.log(current.price) - Math.log(previous.price))
  if (!Number.isFinite(pairMoveLogPercent)) {
    return { status: 'unavailable', reason: 'invalid-price' }
  }
  return {
    status: 'available',
    baseAsset,
    quoteAsset,
    previousTimestamp: previous.timestamp,
    timestamp: current.timestamp,
    baseEffectLogPercent: pairMoveLogPercent,
    quoteEffectLogPercent: 0,
    pairMoveLogPercent,
    stale: Math.max(0, now - current.timestamp) > staleThresholdMs,
  }
}
