import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { circuitBreaker, circuitKeyForPair, circuitKeyForPath } from './circuitBreaker'

describe('pair-level circuit breaker', () => {
  beforeEach(() => {
    circuitBreaker.reset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-15T12:00:00.000Z'))
  })

  afterEach(() => {
    circuitBreaker.reset()
    vi.useRealTimers()
  })

  it('maps encoded price and history paths to the same pair key', () => {
    const key = circuitKeyForPair('BTC/USD')

    expect(circuitKeyForPath('/api/prices/BTC%2FUSD')).toBe(key)
    expect(circuitKeyForPath('/api/prices/BTC%2FUSD/history?limit=10')).toBe(key)
    expect(circuitKeyForPath('/api/prices/history/batch')).toBe('/api/prices')
    expect(circuitKeyForPath('/api/prices?pairs=BTC%2FUSD')).toBe('/api/prices')
  })

  it('isolates failure state by pair and exposes the next retry time', () => {
    const btcKey = circuitKeyForPair('BTC/USD')
    const xlmKey = circuitKeyForPair('XLM/USD')
    const startedAt = Date.now()

    for (let i = 0; i < 5; i += 1) circuitBreaker.recordFailure(btcKey)

    expect(circuitBreaker.getState(btcKey)).toBe('open')
    expect(circuitBreaker.getState(xlmKey)).toBe('closed')
    expect(circuitBreaker.getNextRetryAt(btcKey)).toBe(startedAt + 30_000)
    expect(circuitBreaker.getNextRetryAt(xlmKey)).toBeNull()
  })

  it('clears the retry time when the cooldown allows a half-open request', () => {
    const key = circuitKeyForPair('BTC/USD')
    for (let i = 0; i < 5; i += 1) circuitBreaker.recordFailure(key)

    vi.advanceTimersByTime(30_000)

    expect(circuitBreaker.getState(key)).toBe('half-open')
    expect(circuitBreaker.getNextRetryAt(key)).toBeNull()
    expect(circuitBreaker.canRequest(key)).toBe(true)
    expect(circuitBreaker.canRequest(key)).toBe(false)

    circuitBreaker.recordSuccess(key)
    expect(circuitBreaker.getState(key)).toBe('closed')
    expect(circuitBreaker.getNextRetryAt(key)).toBeNull()
  })
})
