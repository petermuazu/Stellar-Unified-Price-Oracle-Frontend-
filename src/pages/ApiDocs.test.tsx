import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../context/ToastContext'
import { PreferencesProvider } from '../preferences/PreferencesContext'
import { clearStoredErrorReports, getStoredErrorReports } from '../utils/errorReporting'
import { ApiDocs } from './ApiDocs'

afterEach(() => {
  cleanup()
  clearStoredErrorReports()
  vi.unstubAllGlobals()
})

describe('API docs SDK playground', () => {
  const renderApiDocs = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <PreferencesProvider>
            <ApiDocs />
          </PreferencesProvider>
        </ToastProvider>
      </MemoryRouter>,
    )

  it('runs a pair-price SDK example against the configured API and renders its response', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          assetPair: 'XLM-USD',
          price: 0.12,
          timestamp: 1_700_000_000_000,
          confidence: 0.9,
          sources: ['chainlink'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', mockFetch)

    renderApiDocs()
    const sdkTabs = screen.getAllByRole('tab', { name: 'SDK' })
    await user.click(sdkTabs[1])

    expect(screen.getByText(/client\.getPrice\('XLM-USD'\)/)).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Run SDK example' })[1])

    expect(await screen.findByText(/"assetPair": "XLM-USD"/)).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/prices\/XLM-USD$/),
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }),
    )
  })

  it('announces invalid pair paths rather than sending an SDK request', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    renderApiDocs()
    const sdkTabs = screen.getAllByRole('tab', { name: 'SDK' })
    await user.click(sdkTabs[1])
    await user.clear(screen.getAllByLabelText('Path')[1])
    await user.type(screen.getAllByLabelText('Path')[1], '/api/prices')
    await user.click(screen.getAllByRole('button', { name: 'Run SDK example' })[1])

    expect(await screen.findByRole('alert')).toHaveTextContent('Set a valid pair path')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(getStoredErrorReports()).toHaveLength(0)
  })

  it('supports keyboard navigation and exposes the selected snippet as a tab panel', async () => {
    const user = userEvent.setup()
    renderApiDocs()
    const firstTab = screen.getAllByRole('tab', { name: 'curl' })[0]

    firstTab.focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getAllByRole('tab', { name: 'JavaScript' })[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'JavaScript example for /api/prices' })).toBeInTheDocument()
  })

  it('shows the same trace identifier in the failure message and stored request report', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Service unavailable' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    renderApiDocs()
    await user.click(screen.getAllByRole('button', { name: 'Try it out' })[0])

    const alert = await screen.findByRole('alert')
    const traceId = alert.textContent?.match(/Trace ID: (trace-[\w-]+)/)?.[1]
    expect(traceId).toBeTruthy()
    const reports = getStoredErrorReports()
    expect(reports[reports.length - 1]?.traceId).toBe(traceId)
  })
})
