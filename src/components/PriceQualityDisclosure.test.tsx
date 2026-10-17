import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { checkAccessibility } from '../test/accessibility'
import { PriceQualityDisclosure } from './PriceQualityDisclosure'

afterEach(cleanup)

describe('PriceQualityDisclosure', () => {
  it('reports absent flags as unknown instead of treating them as false', () => {
    render(<PriceQualityDisclosure />)

    expect(screen.getAllByText('Not reported by API')).toHaveLength(3)
    expect(screen.getByText(/absent flag is unknown/)).toBeInTheDocument()
  })

  it('distinguishes reported false flags and highlights an API-reported stale value', () => {
    render(<PriceQualityDisclosure flags={{ synthetic: false, stale: true, imputed: false }} />)

    expect(screen.getAllByText('Reported: no')).toHaveLength(2)
    expect(screen.getByText('Reported: yes')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('API marked this value stale')
  })

  it('has no accessibility violations when classifications are missing', async () => {
    await checkAccessibility(<PriceQualityDisclosure />)
  })
})
