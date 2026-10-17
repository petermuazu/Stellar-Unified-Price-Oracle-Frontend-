import { useEffect, useState } from 'react'
import { circuitBreaker, circuitKeyForPair, type CircuitState } from '../api/circuitBreaker'

interface CircuitStatus {
  state: CircuitState
  retryAt: number | null
}

export function CircuitBreakerStatus({ pair }: { pair: string }) {
  const key = circuitKeyForPair(pair)
  const [status, setStatus] = useState<CircuitStatus>(() => ({
    state: circuitBreaker.getState(key),
    retryAt: circuitBreaker.getNextRetryAt(key),
  }))

  useEffect(() => {
    const refresh = () =>
      setStatus({ state: circuitBreaker.getState(key), retryAt: circuitBreaker.getNextRetryAt(key) })
    refresh()
    return circuitBreaker.onStateChange((changedKey) => {
      if (changedKey === key) refresh()
    })
  }, [key])

  return (
    <p
      role="status"
      aria-label={`Circuit breaker status for ${pair}`}
      aria-live="polite"
      className={`mb-4 rounded-lg border px-3 py-2 text-xs ${
        status.state === 'open'
          ? 'border-amber-800 bg-amber-900/20 text-amber-300'
          : 'border-gray-800 bg-gray-900 text-gray-400'
      }`}
    >
      {status.state === 'open' && status.retryAt !== null ? (
        <>
          {pair} requests are paused by the circuit breaker. Next retry:{' '}
          <time dateTime={new Date(status.retryAt).toISOString()}>{new Date(status.retryAt).toLocaleTimeString()}</time>
        </>
      ) : status.state === 'half-open' ? (
        <>{pair} circuit breaker is half-open; one test request is allowed.</>
      ) : (
        <>{pair} circuit breaker is closed; requests are allowed.</>
      )}
    </p>
  )
}
