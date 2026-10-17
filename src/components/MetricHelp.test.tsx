import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { metricHelpDocsHref } from '../data/metricHelp'
import { MetricHelp } from './MetricHelp'

vi.mock('../utils/analytics', () => ({
  trackAnalytics: vi.fn(),
}))

describe('MetricHelp', () => {
  it('opens a keyboard-operable explanation with a deep link and tracks the topic', async () => {
    const { trackAnalytics } = await import('../utils/analytics')
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <MetricHelp topic="confidence" />
      </MemoryRouter>,
    )

    const trigger = screen.getByRole('button', { name: 'Help: Confidence' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.tab()
    expect(trigger).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Confidence' })).toHaveTextContent(
      'A score from 0 to 1 describing how strongly the available oracle sources agree',
    )
    expect(screen.getByRole('link', { name: 'Read the metric guide' })).toHaveAttribute(
      'href',
      metricHelpDocsHref('confidence'),
    )
    expect(trackAnalytics).toHaveBeenCalledWith('engagement', 'metric_help_open', { topic: 'confidence' })

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'Confidence' })).not.toBeInTheDocument()
  })
})
