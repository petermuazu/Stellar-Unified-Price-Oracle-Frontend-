import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { checkAccessibility } from '../test/accessibility'
import ReferenceBenchmarkBadge from './ReferenceBenchmarkBadge'

afterEach(cleanup)

describe('ReferenceBenchmarkBadge', () => {
  it('renders benchmark provenance and labels old observations stale', () => {
    render(
      <ReferenceBenchmarkBadge
        referencePrice={0.31}
        referenceTimestamp="2026-10-15T18:00:00.000Z"
        referenceSource="independent-provider"
      />,
    )

    expect(screen.getByText('Source: independent-provider')).toBeInTheDocument()
    expect(screen.getByText(/Observed:/)).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Stale benchmark observation' })).toBeInTheDocument()
  })

  it('distinguishes loading, unavailable, and request error states accessibly', () => {
    const { rerender } = render(<ReferenceBenchmarkBadge loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading reference benchmark')

    rerender(<ReferenceBenchmarkBadge />)
    expect(screen.getByText('Reference source unavailable for this pair.')).toBeInTheDocument()

    rerender(<ReferenceBenchmarkBadge error="Network failure" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Network failure')
  })

  it('identifies missing upstream provenance rather than inventing a source', () => {
    render(<ReferenceBenchmarkBadge referencePrice={0.31} referenceTimestamp="2026-10-15T18:45:00.000Z" />)

    expect(screen.getByText('Source: Not reported by the API')).toBeInTheDocument()
  })

  it('has no accessibility violations in the unavailable state', async () => {
    await checkAccessibility(<ReferenceBenchmarkBadge />)
  })
})
