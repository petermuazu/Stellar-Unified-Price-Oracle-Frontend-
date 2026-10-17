import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { checkAccessibility } from '../test/accessibility'
import { SourceTickProvenanceLink } from './SourceTickProvenanceLink'

afterEach(cleanup)

describe('SourceTickProvenanceLink', () => {
  it('is keyboard reachable and has no accessibility violations', async () => {
    await checkAccessibility(<SourceTickProvenanceLink url="https://oracle.example/ticks/abc123" />)

    cleanup()
    const user = userEvent.setup()
    render(<SourceTickProvenanceLink url="https://oracle.example/ticks/abc123" />)
    await user.tab()
    expect(screen.getByRole('link')).toHaveFocus()
  })

  it('links only to the API-provided HTTPS source-tick record', () => {
    render(<SourceTickProvenanceLink url="https://oracle.example/ticks/abc123" />)

    const link = screen.getByRole('link', { name: /view source-tick provenance/i })
    expect(link).toHaveAttribute('href', 'https://oracle.example/ticks/abc123')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it.each([
    'javascript:alert(1)',
    'http://oracle.example/ticks/abc123',
    'https://user:pass@oracle.example/ticks/abc123',
  ])('does not render an unsafe provenance URL: %s', (url) => {
    render(<SourceTickProvenanceLink url={url} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('unavailable from the API')
  })
})
