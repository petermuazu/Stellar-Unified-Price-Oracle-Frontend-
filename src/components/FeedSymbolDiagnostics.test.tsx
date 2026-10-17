import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { checkAccessibility } from '../test/accessibility'
import { FeedSymbolDiagnostics } from './FeedSymbolDiagnostics'

describe('FeedSymbolDiagnostics', () => {
  it('identifies unknown, renamed, and missing symbols without inferring provider mappings', () => {
    render(
      <FeedSymbolDiagnostics
        pair="BTC/USD"
        feedSymbols={{
          chainlink: { status: 'matched', canonicalSymbol: 'BTC/USD', observedSymbol: 'BTC/USD' },
          band: { status: 'renamed', canonicalSymbol: 'BTC/USD', observedSymbol: 'BTC' },
          redstone: { status: 'unknown', canonicalSymbol: null, observedSymbol: 'XBT-USD' },
          reflector: { status: 'missing', canonicalSymbol: 'BTC/USD', observedSymbol: null },
        }}
      />,
    )

    expect(
      screen.getByRole('listitem', { name: /band: Renamed, renamed to BTC from canonical BTC\/USD/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('listitem', { name: /redstone: Unknown, unknown feed symbol XBT-USD/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: /reflector: Missing, feed symbol missing/i })).toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: /chainlink: Matched/i })).toBeInTheDocument()
  })

  it('reports unavailable and empty API metadata explicitly', () => {
    const { rerender } = render(<FeedSymbolDiagnostics pair="BTC/USD" />)
    expect(screen.getByRole('status')).toHaveTextContent('unavailable from the API')

    rerender(<FeedSymbolDiagnostics pair="BTC/USD" feedSymbols={{}} />)
    expect(screen.getByRole('status')).toHaveTextContent('no provider symbol mappings')
  })

  it('has no accessibility violations for provider status output', async () => {
    await checkAccessibility(
      <FeedSymbolDiagnostics
        pair="BTC/USD"
        feedSymbols={{ band: { status: 'renamed', canonicalSymbol: 'BTC/USD', observedSymbol: 'BTC' } }}
      />,
    )
  })
})
