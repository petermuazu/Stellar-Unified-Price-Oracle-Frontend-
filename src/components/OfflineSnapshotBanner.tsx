import { memo, useEffect, useState } from 'react'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

interface OfflineSnapshotBannerProps {
  savedAt: number
  isRefreshing: boolean
  onRefresh: () => void
}

function formatSnapshotAge(savedAt: number, now: number): string {
  const seconds = Math.floor(Math.max(0, now - savedAt) / 1_000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export const OfflineSnapshotBanner = memo(function OfflineSnapshotBanner({
  savedAt,
  isRefreshing,
  onRefresh,
}: OfflineSnapshotBannerProps) {
  const { isOnline } = useNetworkStatus()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(timer)
  }, [])

  const age = formatSnapshotAge(savedAt, now)

  return (
    <section
      className="mb-4 p-3 bg-amber-900/30 border border-amber-800 rounded-xl flex flex-wrap items-center gap-3 text-sm text-amber-200"
      aria-label="Offline price snapshot"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">Showing cached prices · snapshot age {age}</p>
        <p className="text-xs text-amber-300">
          {isOnline
            ? 'These prices may be stale. Refresh to fetch the latest snapshot.'
            : 'Your browser is offline. Cached prices remain available; refresh can be retried while offline or when reconnected.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="min-h-[44px] shrink-0 rounded-lg bg-amber-200 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
        aria-label="Refresh prices from the network"
      >
        {isRefreshing ? 'Refreshing…' : 'Refresh now'}
      </button>
    </section>
  )
})
