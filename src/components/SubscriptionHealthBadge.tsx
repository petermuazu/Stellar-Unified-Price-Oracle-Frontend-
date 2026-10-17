import { memo, useEffect, useState } from 'react'
import type { ConnectionStatus } from '../api/websocket'
import { getLastSubscriptionUpdate, subscribeToPairUpdates } from '../realtime/subscriptionHealth'

const STALE_AFTER_MS = 120_000
const CLOCK_TICK_MS = 1_000

interface SubscriptionHealthBadgeProps {
  pair: string
  status: ConnectionStatus
  isOfflineSnapshot?: boolean
}

function relativeAge(receivedAt: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - receivedAt) / 1_000))
  return seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`
}

export const SubscriptionHealthBadge = memo(function SubscriptionHealthBadge({
  pair,
  status,
  isOfflineSnapshot = false,
}: SubscriptionHealthBadgeProps) {
  const [receivedAt, setReceivedAt] = useState<number | null>(() => getLastSubscriptionUpdate(pair))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setReceivedAt(getLastSubscriptionUpdate(pair))
    const unsubscribe = subscribeToPairUpdates(pair, setReceivedAt)
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS)
    return () => {
      unsubscribe()
      clearInterval(timer)
    }
  }, [pair])

  const isConnected = status === 'connected' || status === 'paused'
  const health = isOfflineSnapshot
    ? 'Offline snapshot'
    : !isConnected
      ? 'Unavailable'
      : receivedAt === null
        ? 'Waiting for updates'
        : now - receivedAt >= STALE_AFTER_MS
          ? 'Stale'
          : 'Live'
  const color =
    health === 'Live'
      ? 'text-green-400'
      : health === 'Stale' || health === 'Waiting for updates'
        ? 'text-amber-300'
        : 'text-gray-400'
  const description = receivedAt === null ? health : `${health} · last update ${relativeAge(receivedAt, now)}`

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${color}`}
      aria-label={`${pair} subscription health: ${description}`}
      title={`${pair} subscription health: ${description}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${health === 'Live' ? 'bg-green-500' : health === 'Stale' || health === 'Waiting for updates' ? 'bg-amber-400' : 'bg-gray-500'}`}
        aria-hidden="true"
      />
      {health}
    </span>
  )
})
