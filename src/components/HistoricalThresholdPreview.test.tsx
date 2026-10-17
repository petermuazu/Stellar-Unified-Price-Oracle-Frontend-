import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ValuedHolding } from '../utils/portfolio'
import { HistoricalThresholdPreview } from './HistoricalThresholdPreview'

const { historyState } = vi.hoisted(() => ({
  historyState: {
    history: [] as Array<{ price: number; timestamp: number; confidence: number; sources: string[] }>,
    loading: false,
    error: null as Error | null,
  },
}))

vi.mock('../hooks/usePriceHistory', () => ({
  usePriceHistory: () => historyState,
}))

const holdings: ValuedHolding[] = [
  {
    id: '1',
    assetPair: 'XLM/USD',
    amount: 100,
    baseAsset: 'XLM',
    quoteAsset: 'USD',
    price: 0.12,
    value: 12,
    status: 'available',
    sources: ['band'],
  },
  {
    id: '2',
    assetPair: 'BTC/USD',
    amount: 0.01,
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    price: 50_000,
    value: 500,
    status: 'available',
    sources: ['chainlink'],
  },
]

describe('HistoricalThresholdPreview', () => {
  beforeEach(() => {
    historyState.history = []
    historyState.loading = false
    historyState.error = null
  })

  it('lets keyboard users stage a threshold while clearly withholding unsupported recalculation', async () => {
    historyState.history = [
      { price: 0.1, timestamp: 1_000, confidence: 0.9, sources: ['band'] },
      { price: 0.12, timestamp: 2_000, confidence: 0.95, sources: ['band', 'chainlink'] },
    ]
    const user = userEvent.setup()
    render(<HistoricalThresholdPreview holdings={holdings} />)

    await user.tab()
    expect(screen.getByLabelText('Asset pair')).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText('Candidate z-score threshold')).toHaveFocus()
    await user.clear(screen.getByLabelText('Candidate z-score threshold'))
    await user.type(screen.getByLabelText('Candidate z-score threshold'), '4.5')

    expect(screen.getByRole('status')).toHaveTextContent('Candidate threshold: 4.5 z-score')
    expect(screen.getByRole('status')).toHaveTextContent('Recalculated historical prices are unavailable')
    expect(screen.getByText(/Existing baseline only: 2 aggregate points/)).toBeInTheDocument()
  })

  it('handles empty history, loading, errors, and invalid threshold inputs explicitly', () => {
    historyState.loading = true
    const { rerender } = render(<HistoricalThresholdPreview holdings={holdings} />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading historical aggregate prices')

    historyState.loading = false
    historyState.error = new Error('network unavailable')
    rerender(<HistoricalThresholdPreview holdings={holdings} />)
    expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded')

    historyState.error = null
    rerender(<HistoricalThresholdPreview holdings={[]} />)
    expect(screen.getByText('Add a holding to select a pair with historical prices.')).toBeInTheDocument()

    historyState.history = [{ price: 1, timestamp: 1_000, confidence: 0.8, sources: ['band'] }]
    rerender(<HistoricalThresholdPreview holdings={holdings} />)
    fireEvent.change(screen.getByLabelText('Candidate z-score threshold'), { target: { value: '11' } })
    expect(screen.getByRole('alert')).toHaveTextContent('0.1 to 10')
    expect(screen.getByRole('status')).toHaveTextContent('Candidate threshold: invalid')
  })
})
