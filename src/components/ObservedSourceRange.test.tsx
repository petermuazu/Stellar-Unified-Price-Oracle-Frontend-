import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ObservedSourceRange } from './ObservedSourceRange'

afterEach(cleanup)

describe('ObservedSourceRange', () => {
  it('displays the observed low and high prices with a screen-reader clarification', () => {
    render(<ObservedSourceRange range={{ low: 99, high: 101, sourceCount: 2, timestamp: Date.now() }} />)

    expect(screen.getByText(/Observed source band \(min–max\):/)).toBeInTheDocument()
    expect(screen.getByText(/99\.00/)).toBeInTheDocument()
    expect(screen.getByText(/not a statistical confidence interval/)).toHaveClass('sr-only')
  })

  it('announces when a range is unavailable', () => {
    render(<ObservedSourceRange range={null} />)
    expect(screen.getByRole('status')).toHaveTextContent('at least two current source-reported prices')
  })
})
