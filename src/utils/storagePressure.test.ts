import { afterEach, describe, expect, it, vi } from 'vitest'
import { estimateStorageUsage, isStorageNearQuota, STORAGE_PRESSURE_THRESHOLD } from './storagePressure'

afterEach(() => vi.unstubAllGlobals())

describe('storage pressure', () => {
  it('warns at or above the quota threshold', () => {
    expect(isStorageNearQuota({ usage: 80, quota: 100, ratio: STORAGE_PRESSURE_THRESHOLD })).toBe(true)
    expect(isStorageNearQuota({ usage: 79, quota: 100, ratio: 0.79 })).toBe(false)
    expect(isStorageNearQuota(null)).toBe(false)
  })

  it('returns browser storage usage estimates', async () => {
    const estimate = vi.fn().mockResolvedValue({ usage: 90, quota: 100 })
    vi.stubGlobal('navigator', { storage: { estimate } })

    await expect(estimateStorageUsage()).resolves.toEqual({ usage: 90, quota: 100, ratio: 0.9 })
    expect(estimate).toHaveBeenCalledOnce()
  })

  it('treats unavailable or invalid estimates as inconclusive', async () => {
    vi.stubGlobal('navigator', { storage: { estimate: vi.fn().mockResolvedValue({ usage: 1, quota: 0 }) } })
    await expect(estimateStorageUsage()).resolves.toBeNull()

    vi.stubGlobal('navigator', { storage: { estimate: vi.fn().mockRejectedValue(new Error('blocked')) } })
    await expect(estimateStorageUsage()).resolves.toBeNull()
  })
})
