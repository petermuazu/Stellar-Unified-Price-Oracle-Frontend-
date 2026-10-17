import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { ValuedHolding } from '../utils/portfolio'
import { PortfolioScenario } from './PortfolioScenario'

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
    amount: 0.1,
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    price: null,
    value: null,
    status: 'stale',
    sources: ['chainlink'],
  },
]

describe('PortfolioScenario', () => {
  it('models current provider notional and a keyboard-editable assumed spread stress', async () => {
    const user = userEvent.setup()
    render(<PortfolioScenario holdings={holdings} />)

    await user.selectOptions(screen.getByLabelText('Provider outage scenario'), 'band')
    const providerImpact = screen.getByLabelText('Current notional listing band')
    expect(within(providerImpact).getByText('12')).toBeInTheDocument()

    const wideningInput = screen.getByLabelText('Assumed adverse widening (%)')
    await user.clear(wideningInput)
    await user.type(wideningInput, '10')
    const stressImpact = screen.getByLabelText('Hypothetical loss at 10%')
    expect(within(stressImpact).getByText('1.2')).toBeInTheDocument()
    expect(screen.getByText(/1 stale or unavailable holding/)).toBeInTheDocument()
  })

  it('reports invalid assumptions and does not display a calculated stress', () => {
    render(<PortfolioScenario holdings={holdings} />)
    fireEvent.change(screen.getByLabelText('Assumed adverse widening (%)'), { target: { value: '101' } })

    expect(screen.getByRole('alert')).toHaveTextContent('0% to 100%')
    expect(screen.getByLabelText('Hypothetical loss at —%')).toHaveTextContent(
      'No fresh holding values are available for this stress scenario.',
    )
  })
})
