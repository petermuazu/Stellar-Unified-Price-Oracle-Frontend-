import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { MoveAttribution } from '../types'
import { ConfidenceRegimePanel } from './ConfidenceRegimePanel'

afterEach(cleanup)

function makeTick(timestamp: number, deltaPercent: number | null): MoveAttribution {
  return {
    assetPair: 'XLM/USD',
    timestamp,
    price: 1,
    confidence: 0.92,
    previousConfidence: null,
    delta: null,
    deltaPercent,
    sources: [],
    leadingSources: [],
  }
}

describe('ConfidenceRegimePanel', () => {
  it('shows the no-history state accessibly', () => {
    render(<ConfidenceRegimePanel histories={new Map()} />)
    expect(screen.getByRole('status')).toHaveTextContent('enough live price ticks')
  })

  it('renders per-asset confidence regime summaries', () => {
    render(
      <ConfidenceRegimePanel
        histories={
          new Map([
            [
              'XLM/USD',
              [
                makeTick(Date.now(), null),
                makeTick(Date.now() + 1, 0.1),
                makeTick(Date.now() + 2, -0.4),
                makeTick(Date.now() + 3, 1.2),
                makeTick(Date.now() + 4, 0.3),
              ],
            ],
          ])
        }
      />,
    )

    expect(screen.getByRole('table')).toHaveAccessibleName(/mean reported confidence/i)
    expect(screen.getByRole('row', { name: /XLM\/USD/ })).toHaveTextContent('92.0%')
  })

  it('announces stale live tick history', () => {
    render(<ConfidenceRegimePanel histories={new Map([['XLM/USD', [makeTick(Date.now() - 10 * 60_000, null)]]])} />)

    expect(
      screen.getByText('Live tick history is stale; these summaries may not reflect current conditions.'),
    ).toBeInTheDocument()
  })
})
