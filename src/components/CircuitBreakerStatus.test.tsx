import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { circuitBreaker, circuitKeyForPair } from '../api/circuitBreaker'
import { CircuitBreakerStatus } from './CircuitBreakerStatus'

vi.mock('../context/ToastContext', () => ({ showApiErrorToast: vi.fn() }))

describe('CircuitBreakerStatus', () => {
  beforeEach(() => {
    circuitBreaker.reset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-15T12:00:00.000Z'))
  })

  afterEach(() => {
    cleanup()
    circuitBreaker.reset()
    vi.useRealTimers()
  })

  it('announces the pair state and retry time as the breaker changes', () => {
    const key = circuitKeyForPair('BTC/USD')
    render(<CircuitBreakerStatus pair="BTC/USD" />)

    const status = screen.getByRole('status', { name: 'Circuit breaker status for BTC/USD' })
    expect(status).toHaveTextContent('closed; requests are allowed')

    act(() => {
      for (let i = 0; i < 5; i += 1) circuitBreaker.recordFailure(key)
    })
    expect(status).toHaveTextContent('requests are paused by the circuit breaker')
    expect(status).toHaveTextContent('Next retry:')
    expect(status.querySelector('time')).toHaveAttribute('datetime', '2026-10-15T12:00:30.000Z')

    act(() => vi.advanceTimersByTime(30_000))
    expect(status).toHaveTextContent('half-open; one test request is allowed')

    act(() => circuitBreaker.recordSuccess(key))
    expect(status).toHaveTextContent('closed; requests are allowed')
  })
})
