const listenersByPair = new Map<string, Set<(receivedAt: number) => void>>()
const lastUpdateByPair = new Map<string, number>()

export function recordSubscriptionUpdate(pair: string, receivedAt: number): void {
  lastUpdateByPair.set(pair, receivedAt)
  listenersByPair.get(pair)?.forEach((listener) => listener(receivedAt))
}

export function getLastSubscriptionUpdate(pair: string): number | null {
  return lastUpdateByPair.get(pair) ?? null
}

export function subscribeToPairUpdates(pair: string, listener: (receivedAt: number) => void): () => void {
  let listeners = listenersByPair.get(pair)
  if (!listeners) {
    listeners = new Set()
    listenersByPair.set(pair, listeners)
  }
  listeners.add(listener)
  return () => {
    listeners?.delete(listener)
    if (listeners?.size === 0) listenersByPair.delete(pair)
  }
}
