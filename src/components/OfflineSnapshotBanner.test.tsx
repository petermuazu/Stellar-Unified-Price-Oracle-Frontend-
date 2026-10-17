import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { checkAccessibility } from '../test/accessibility'
import { OfflineSnapshotBanner } from './OfflineSnapshotBanner'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('OfflineSnapshotBanner', () => {
  it('shows snapshot age and keeps refresh available while offline', () => {
    const onRefresh = vi.fn()
    render(<OfflineSnapshotBanner savedAt={Date.now() - 65_000} isRefreshing={false} onRefresh={onRefresh} />)
    act(() => window.dispatchEvent(new Event('offline')))

    expect(screen.getByText(/snapshot age 1m ago/)).toBeInTheDocument()
    expect(screen.getByText(/Your browser is offline/)).toBeInTheDocument()
    const refresh = screen.getByRole('button', { name: 'Refresh prices from the network' })
    expect(refresh).toBeEnabled()
    fireEvent.click(refresh)
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('updates the displayed age as the cached snapshot gets older', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    render(<OfflineSnapshotBanner savedAt={Date.now() - 1_000} isRefreshing={false} onRefresh={vi.fn()} />)
    expect(screen.getByText(/snapshot age 1s ago/)).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByText(/snapshot age 1m ago/)).toBeInTheDocument()
  })

  it('disables refresh during an active request and has no accessibility violations', async () => {
    const banner = <OfflineSnapshotBanner savedAt={Date.now()} isRefreshing onRefresh={vi.fn()} />
    render(banner)
    expect(screen.getByRole('button', { name: 'Refresh prices from the network' })).toBeDisabled()
    expect(screen.getByText('Refreshing…')).toBeInTheDocument()
    await checkAccessibility(banner)
  })
})
