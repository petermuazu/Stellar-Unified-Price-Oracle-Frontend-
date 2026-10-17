import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { checkAccessibility } from '../test/accessibility'
import { ProviderPrecisionComparison } from './ProviderPrecisionComparison'

const pairMetadata = { baseUnit: 'BTC', quoteUnit: 'USD', priceScale: 2 }

describe('ProviderPrecisionComparison', () => {
  it('normalizes provider values to the canonical scale and compares reported precision', () => {
    render(
      <ProviderPrecisionComparison
        pair="BTC/USD"
        pairMetadata={pairMetadata}
        sourcePrices={{ redstone: 50000.123, chainlink: 50000.1 }}
        sourcePriceDecimals={{ redstone: 5, chainlink: 2 }}
        timestamp={0}
      />,
    )

    expect(screen.getByRole('cell', { name: '50000.10' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '50000.12' })).toBeInTheDocument()
    expect(screen.getByText('Matches canonical scale')).toBeInTheDocument()
    expect(screen.getByText('Finer than canonical scale')).toBeInTheDocument()
  })

  it('labels missing provider precision instead of deriving it from JS numbers', () => {
    render(
      <ProviderPrecisionComparison
        pair="BTC/USD"
        pairMetadata={pairMetadata}
        sourcePrices={{ chainlink: 50000.1 }}
        timestamp={0}
      />,
    )

    expect(screen.getByText('Precision unavailable')).toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })

  it('marks stale aggregate snapshots explicitly', () => {
    render(
      <ProviderPrecisionComparison
        pair="BTC/USD"
        pairMetadata={pairMetadata}
        sourcePrices={{ chainlink: 50000.1 }}
        sourcePriceDecimals={{ chainlink: 3 }}
        timestamp={0}
      />,
    )

    expect(screen.getByRole('status', { name: 'Stale provider snapshot for BTC/USD' })).toHaveTextContent(
      'Snapshot is stale',
    )
  })

  it('reports unavailable prices and unavailable normalization scale', () => {
    const { rerender } = render(<ProviderPrecisionComparison pair="BTC/USD" timestamp={0} />)
    expect(screen.getByRole('status')).toHaveTextContent('unavailable from the API')

    rerender(<ProviderPrecisionComparison pair="BTC/USD" sourcePrices={{ chainlink: 50000 }} timestamp={0} />)
    expect(screen.getByRole('status')).toHaveTextContent('canonical price scale is unavailable')
  })

  it('has no accessibility violations when comparison data is available', async () => {
    await checkAccessibility(
      <ProviderPrecisionComparison
        pair="BTC/USD"
        pairMetadata={pairMetadata}
        sourcePrices={{ chainlink: 50000.1 }}
        sourcePriceDecimals={{ chainlink: 3 }}
        timestamp={0}
      />,
    )
  })
})
