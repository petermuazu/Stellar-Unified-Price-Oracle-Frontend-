import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { checkAccessibility } from '../test/accessibility'
import type { PriceHistoryEntry } from '../types'
import { PairMovementEffectsPanel } from './PairMovementEffectsPanel'

const history: PriceHistoryEntry[] = [
  { price: 0.1, timestamp: 1, confidence: 0.9, sources: ['chainlink'] },
  { price: 0.11, timestamp: 2, confidence: 0.9, sources: ['chainlink'] },
]

describe('PairMovementEffectsPanel', () => {
  it('renders base, quote, and net movement effects', () => {
    render(
      <PairMovementEffectsPanel
        pair="XLM/USD"
        history={history}
        loading={false}
        error={null}
        staleThresholdMinutes={5}
      />,
    )

    expect(screen.getByText('XLM effect')).toBeInTheDocument()
    expect(screen.getByText('USD effect')).toBeInTheDocument()
    expect(screen.getByText('Pair movement')).toBeInTheDocument()
    expect(screen.getByText('USD effect').nextElementSibling?.textContent?.replace(/\s/g, '')).toBe('+0.0000pp')
  })

  it('explains why non-USD pairs cannot be decomposed from available history', () => {
    render(
      <PairMovementEffectsPanel
        pair="BTC/EUR"
        history={history}
        loading={false}
        error={null}
        staleThresholdMinutes={5}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/synchronized base\/USD and quote\/USD history/i)
  })

  it('reports loading and history failure states accessibly', () => {
    const { rerender } = render(
      <PairMovementEffectsPanel pair="XLM/USD" history={[]} loading error={null} staleThresholdMinutes={5} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(/loading history/i)

    rerender(
      <PairMovementEffectsPanel
        pair="XLM/USD"
        history={[]}
        loading={false}
        error={new Error('offline')}
        staleThresholdMinutes={5}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('offline')
  })

  it('has no accessibility violations when effects are available', async () => {
    await checkAccessibility(
      <PairMovementEffectsPanel
        pair="XLM/USD"
        history={history}
        loading={false}
        error={null}
        staleThresholdMinutes={5}
      />,
    )
  })
})
