import type { FeedSymbolMetadata } from '../types'

interface FeedSymbolDiagnosticsProps {
  pair: string
  feedSymbols?: Record<string, FeedSymbolMetadata>
  compact?: boolean
}

const STATUS_LABELS: Record<FeedSymbolMetadata['status'], string> = {
  matched: 'Matched',
  renamed: 'Renamed',
  unknown: 'Unknown',
  missing: 'Missing',
}

function getSymbolDescription(symbol: FeedSymbolMetadata): string {
  switch (symbol.status) {
    case 'matched':
      return `matches canonical symbol ${symbol.canonicalSymbol ?? 'unavailable'}`
    case 'renamed':
      return `renamed to ${symbol.observedSymbol ?? 'unavailable'} from canonical ${symbol.canonicalSymbol ?? 'unavailable'}`
    case 'unknown':
      return `unknown feed symbol ${symbol.observedSymbol ?? 'unavailable'}`
    case 'missing':
      return `feed symbol missing${symbol.canonicalSymbol ? `; expected ${symbol.canonicalSymbol}` : ''}`
  }
}

export function FeedSymbolDiagnostics({ pair, feedSymbols, compact = false }: FeedSymbolDiagnosticsProps) {
  const entries = Object.entries(feedSymbols ?? {})

  return (
    <section
      aria-label={`Provider feed symbols for ${pair}`}
      className={compact ? 'mt-2' : 'bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6'}
    >
      {!compact && <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Provider feed symbols</h2>}
      {!feedSymbols ? (
        <p className="text-xs text-gray-500" role="status">
          Provider symbol mappings unavailable from the API.
        </p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-gray-500" role="status">
          The API returned no provider symbol mappings.
        </p>
      ) : (
        <ul className={compact ? 'flex flex-wrap gap-1.5' : 'space-y-2'}>
          {entries.map(([provider, symbol]) => {
            const needsAttention = symbol.status !== 'matched'
            const description = getSymbolDescription(symbol)
            return (
              <li
                key={provider}
                className={`text-xs ${compact ? 'px-2 py-1 rounded border' : 'px-3 py-2 rounded-lg border'} ${
                  needsAttention
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                    : 'border-gray-700 bg-gray-800/60 text-gray-300'
                }`}
                aria-label={`${provider}: ${STATUS_LABELS[symbol.status]}, ${description}`}
              >
                <span className="font-medium">{provider}</span>
                <span aria-hidden="true"> · </span>
                <span>{STATUS_LABELS[symbol.status]}</span>
                {!compact && <span className="ml-1 text-gray-400">— {description}</span>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
