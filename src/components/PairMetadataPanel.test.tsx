import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PairMetadataPanel } from './PairMetadataPanel'

describe('PairMetadataPanel', () => {
  it('renders canonical units and scale supplied by the API', () => {
    render(<PairMetadataPanel pair="BTC/USD" metadata={{ baseUnit: 'BTC', quoteUnit: 'USD', priceScale: 8 }} />)

    expect(screen.getByText('BTC')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('8 decimal places')).toBeInTheDocument()
  })

  it('states when metadata is absent instead of inferring units or scale', () => {
    render(<PairMetadataPanel pair="BTC/USD" />)
    expect(screen.getByRole('status')).toHaveTextContent('unavailable from the API')
  })

  it('marks partial metadata as unavailable', () => {
    render(<PairMetadataPanel pair="BTC/USD" metadata={{ baseUnit: 'BTC', quoteUnit: null, priceScale: null }} />)
    expect(screen.getByText('BTC')).toBeInTheDocument()
    expect(screen.getAllByText('Unavailable')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('Some canonical metadata fields')
  })
})
