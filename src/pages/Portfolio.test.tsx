import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { PreferencesProvider } from '../preferences/PreferencesContext'
import { openCacheConnection } from '../hooks/useIndexedDB'
import type { PriceContextValue } from '../context/PriceContext'
import { usePriceContext } from '../context/PriceContext'
import { checkAccessibility } from '../test/accessibility'
import { Portfolio } from './Portfolio'

vi.mock('../context/PriceContext', () => ({ usePriceContext: vi.fn() }))

afterEach(cleanup)

const priceTimestamp = Date.now()
const priceContext: PriceContextValue = {
  prices: [
    { assetPair: 'BTC/USD', price: 60_000, timestamp: priceTimestamp, confidence: 1, sources: ['chainlink'] },
    { assetPair: 'XLM/USD', price: 0.2, timestamp: priceTimestamp, confidence: 1, sources: ['reflector'] },
  ],
  pricesLoading: false,
  pricesError: null,
  pricesValidating: false,
  livePrices: new Map(),
  wsStatus: 'connected',
  rateLimitStatus: 'ok',
  rateLimitRetryAfterMs: 0,
  outboundQueued: 0,
  pricesQueued: false,
  requestsThrottled: false,
  refetchPrices: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  _emitPriceUpdate: vi.fn(),
  attributionHistory: new Map(),
  isWsLeader: null,
}

function renderPortfolio() {
  return render(
    <MemoryRouter>
      <PreferencesProvider>
        <Portfolio />
      </PreferencesProvider>
    </MemoryRouter>,
  )
}

async function waitForPortfolioReady() {
  await waitFor(() => expect(screen.queryByText('Loading local portfolio…')).not.toBeInTheDocument())
}

beforeEach(async () => {
  vi.mocked(usePriceContext).mockReturnValue(priceContext)
  const db = await openCacheConnection()
  await new Promise<void>((resolve, reject) => {
    const request = db
      .transaction('preferences', 'readwrite')
      .objectStore('preferences')
      .delete('local-portfolio-snapshots')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
})

describe('Portfolio', () => {
  it('adds a holding and saves an auditable local valuation snapshot', async () => {
    const view = renderPortfolio()

    await screen.findByText(/No holdings yet/)
    await waitForPortfolioReady()
    fireEvent.change(screen.getByLabelText('Asset pair'), { target: { value: 'BTC/USD' } })
    fireEvent.change(screen.getByLabelText('Holding quantity'), { target: { value: '0.5' } })
    expect(screen.getByRole('button', { name: 'Add holding' })).not.toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Add holding' }))

    expect(await screen.findAllByText('$30,000 USD')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Save valuation snapshot' }))

    await waitFor(() => expect(screen.getAllByText('$30,000 USD')).toHaveLength(3))
    expect(screen.getByText('Show snapshot inputs')).toBeInTheDocument()
    expect(screen.getByText(/from BTC\/USD/)).toBeInTheDocument()

    view.unmount()
    renderPortfolio()
    expect(await screen.findByText('Show snapshot inputs')).toBeInTheDocument()
  })

  it('keeps total and snapshot unavailable when a required quote is missing', async () => {
    vi.mocked(usePriceContext).mockReturnValue({ ...priceContext, prices: [priceContext.prices[0]] })
    renderPortfolio()

    await waitForPortfolioReady()
    fireEvent.change(screen.getByLabelText('Asset pair'), { target: { value: 'ETH/USD' } })
    fireEvent.change(screen.getByLabelText('Holding quantity'), { target: { value: '2' } })
    expect(screen.getByRole('button', { name: 'Add holding' })).not.toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Add holding' }))

    await screen.findByText(/No valid ETH\/USD oracle price/)
    expect(screen.getByText(/Complete portfolio value/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save valuation snapshot' })).toBeDisabled()
  })

  it('labels stale API inputs and reports no-price loading state', async () => {
    vi.mocked(usePriceContext).mockReturnValue({
      ...priceContext,
      prices: [{ ...priceContext.prices[0], qualityFlags: { stale: true } }],
      pricesLoading: true,
    })
    renderPortfolio()

    await waitForPortfolioReady()
    fireEvent.change(screen.getByLabelText('Asset pair'), { target: { value: 'BTC/USD' } })
    fireEvent.change(screen.getByLabelText('Holding quantity'), { target: { value: '1' } })
    expect(screen.getByRole('button', { name: 'Add holding' })).not.toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Add holding' }))

    await screen.findByText('Stale oracle input; value shown for review only.')
    expect(screen.getByText('This valuation includes one or more stale oracle inputs.')).toBeInTheDocument()
  })

  it('announces loading and has no accessibility violations with no market data', async () => {
    vi.mocked(usePriceContext).mockReturnValue({ ...priceContext, prices: [], pricesLoading: true })
    const wrapper = (children: ReactNode) => (
      <MemoryRouter>
        <PreferencesProvider>{children}</PreferencesProvider>
      </MemoryRouter>
    )
    await checkAccessibility(<Portfolio />, { wrapper })
    expect(screen.getByText('Loading oracle prices…')).toBeInTheDocument()
  })
})
