export const STORAGE_PRESSURE_THRESHOLD = 0.8

export interface StorageUsage {
  usage: number
  quota: number
  ratio: number
}

/**
 * Read the browser's origin-wide storage estimate. Unsupported or unavailable
 * estimates are inconclusive and therefore do not trigger a warning.
 */
export async function estimateStorageUsage(): Promise<StorageUsage | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null

  try {
    const { usage, quota } = await navigator.storage.estimate()
    if (
      typeof usage !== 'number' ||
      typeof quota !== 'number' ||
      !Number.isFinite(usage) ||
      !Number.isFinite(quota) ||
      quota <= 0
    ) {
      return null
    }
    return { usage, quota, ratio: usage / quota }
  } catch {
    return null
  }
}

export function isStorageNearQuota(usage: StorageUsage | null): boolean {
  return usage !== null && usage.ratio >= STORAGE_PRESSURE_THRESHOLD
}
