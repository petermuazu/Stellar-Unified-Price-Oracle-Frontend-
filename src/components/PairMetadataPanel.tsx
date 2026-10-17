import type { PairMetadata } from '../types'

interface PairMetadataPanelProps {
  pair: string
  metadata?: PairMetadata
  compact?: boolean
}

export function PairMetadataPanel({ pair, metadata, compact = false }: PairMetadataPanelProps) {
  const unavailable = 'Unavailable'
  const baseUnit = metadata?.baseUnit ?? unavailable
  const quoteUnit = metadata?.quoteUnit ?? unavailable
  const scale = metadata?.priceScale == null ? unavailable : `${metadata.priceScale} decimal places`

  return (
    <div
      aria-label={`Canonical unit and scale metadata for ${pair}`}
      className={compact ? 'mt-2 text-xs text-gray-500' : 'bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6'}
      role={compact ? 'group' : 'region'}
    >
      {!compact && <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Canonical units and scale</h2>}
      {metadata ? (
        <dl className={compact ? 'flex flex-wrap gap-x-3 gap-y-1' : 'grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm'}>
          <div>
            <dt className={compact ? 'sr-only' : 'text-xs text-gray-500'}>Base unit</dt>
            <dd>{compact ? `${baseUnit} / ${quoteUnit}` : baseUnit}</dd>
          </div>
          {!compact && (
            <>
              <div>
                <dt className="text-xs text-gray-500">Quote unit</dt>
                <dd className="text-gray-100">{quoteUnit}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Price scale</dt>
                <dd className="text-gray-100">{scale}</dd>
              </div>
            </>
          )}
          {compact && <div>{scale}</div>}
        </dl>
      ) : (
        <p className={compact ? '' : 'text-sm text-gray-400'} role="status">
          Canonical unit and scale metadata unavailable from the API.
        </p>
      )}
      {!compact && metadata && (baseUnit === unavailable || quoteUnit === unavailable || scale === unavailable) && (
        <p className="mt-2 text-xs text-amber-300" role="status">
          Some canonical metadata fields are unavailable from the API.
        </p>
      )}
    </div>
  )
}
