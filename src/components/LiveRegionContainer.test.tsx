import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { resetAnnouncementRegistry, useAnnounce } from '../hooks/useAnnounce'
import { LiveRegionContainer } from './LiveRegionContainer'

describe('LiveRegionContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetAnnouncementRegistry()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    resetAnnouncementRegistry()
  })

  it('renders price updates politely and alert firings assertively', () => {
    render(<LiveRegionContainer />)
    const { result } = renderHook(() => useAnnounce())

    act(() => {
      result.current.announce('BTC/USD moved up 2.0%', 'polite')
    })

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('status')).toHaveTextContent('BTC/USD moved up 2.0%')

    act(() => {
      result.current.announce('Alert triggered for BTC/USD', 'assertive')
    })

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
    expect(screen.getByRole('alert')).toHaveTextContent('Alert triggered for BTC/USD')
  })

  it('queues polite messages in order instead of replacing them during bursts', () => {
    render(<LiveRegionContainer />)
    const { result } = renderHook(() => useAnnounce())

    act(() => {
      result.current.announce('First price move')
      result.current.announce('Second price move')
      result.current.announce('Third price move')
    })

    const politeRegion = screen.getByRole('status')
    expect(politeRegion).toHaveTextContent('First price move')

    act(() => {
      vi.advanceTimersByTime(ANNOUNCEMENT_DURATION_MS)
    })
    expect(politeRegion).toBeEmptyDOMElement()

    act(() => {
      vi.advanceTimersByTime(ANNOUNCEMENT_GAP_MS)
    })
    expect(politeRegion).toHaveTextContent('Second price move')

    act(() => {
      vi.advanceTimersByTime(ANNOUNCEMENT_DURATION_MS + ANNOUNCEMENT_GAP_MS)
    })
    expect(politeRegion).toHaveTextContent('Third price move')
  })
})

const ANNOUNCEMENT_DURATION_MS = 1000
const ANNOUNCEMENT_GAP_MS = 100
