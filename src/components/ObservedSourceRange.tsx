import { memo } from 'react'
import { formatPrice } from '../utils/format'
import type { ObservedSourceRange as ObservedSourceRangeData } from '../utils/uncertaintyBand'

interface ObservedSourceRangeProps {
  range: ObservedSourceRangeData | null
  compact?: boolean
  showUnavailable?: boolean
}

export const ObservedSourceRange = memo(function ObservedSourceRange({
  range,
  compact = false,
  showUnavailable = true,
}: ObservedSourceRangeProps) {
  return range ? (
    <p className={`text-xs text-gray-400 ${compact ? 'mt-2' : 'mt-3'}`}>
      <span className="font-medium text-gray-300">Observed source band (min–max):</span>{' '}
      <span className="font-mono">
        ${formatPrice(range.low)} – ${formatPrice(range.high)}
      </span>{' '}
      <span>({range.sourceCount} reported sources)</span>
      <span className="sr-only">
        . This envelope uses reported source prices only; it is not a statistical confidence interval.
      </span>
    </p>
  ) : showUnavailable ? (
    <p className={`text-xs text-gray-500 ${compact ? 'mt-2' : 'mt-3'}`} role="status">
      Observed source range unavailable; at least two current source-reported prices are required.
    </p>
  ) : null
})
