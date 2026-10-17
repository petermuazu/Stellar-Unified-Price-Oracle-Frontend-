import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { MoveAttribution } from '../types'
import { ConfidenceChangeExplanation } from './ConfidenceChangeExplanation'

afterEach(cleanup)

function tick(overrides: Partial<MoveAttribution> = {}): MoveAttribution {
  return {
    assetPair: 'BTC/USD',
    timestamp: Date.now(),
    price: 100,
    confidence: 0.8,
    previousConfidence: 0.7,
    delta: 1,
    deltaPercent: 1,
    sources: [
      { source: 'chainlink', price: 99, priceIsObserved: true, prevPrice: 98, delta: 1, deltaPercent: 1 },
      { source: 'redstone', price: 101, priceIsObserved: true, prevPrice: 100, delta: 1, deltaPercent: 1 },
    ],
    leadingSources: [],
    ...overrides,
  }
}

describe('ConfidenceChangeExplanation', () => {
  it('reports the score transition and concurrent observed input changes without claiming causality', () => {
    const previous = tick({
      confidence: 0.7,
      previousConfidence: 0.6,
      deltaPercent: 0.2,
      sources: [
        { source: 'chainlink', price: 99, priceIsObserved: true, prevPrice: 98, delta: 1, deltaPercent: 1 },
        { source: 'band', price: 100, priceIsObserved: true, prevPrice: 100, delta: 0, deltaPercent: 0 },
      ],
    })
    render(<ConfidenceChangeExplanation latest={tick()} previous={previous} />)

    expect(screen.getByText(/Confidence changed from 70.0% to 80.0%/)).toBeInTheDocument()
    expect(
      screen.getByText(/Contributing sources changed from band, chainlink to chainlink, redstone/),
    ).toBeInTheDocument()
    expect(screen.getByText(/not causal attribution/)).toBeInTheDocument()
  })

  it('handles a missing preceding confidence score', () => {
    render(<ConfidenceChangeExplanation latest={tick({ previousConfidence: null })} />)
    expect(screen.getByRole('status')).toHaveTextContent('previous live confidence score is not available')
  })

  it('reports unchanged confidence rather than inventing reasons', () => {
    render(
      <ConfidenceChangeExplanation latest={tick({ confidence: 0.8, previousConfidence: 0.8 })} previous={tick()} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Confidence is unchanged at 80.0%')
    expect(screen.queryByLabelText('Concurrent input changes')).not.toBeInTheDocument()
  })

  it('discloses when the API has too little comparable input data', () => {
    render(
      <ConfidenceChangeExplanation
        latest={tick({ sources: [], deltaPercent: null })}
        previous={tick({ sources: [], deltaPercent: null })}
      />,
    )
    expect(screen.getByText(/not contain enough comparable inputs/)).toBeInTheDocument()
  })
})
