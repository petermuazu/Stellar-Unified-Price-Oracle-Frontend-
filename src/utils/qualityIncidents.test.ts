import { describe, expect, it } from 'vitest'
import { buildExcludedSourceAnnotations } from './qualityIncidents'

describe('buildExcludedSourceAnnotations', () => {
  it('marks only history points with reported excluded-source metadata', () => {
    const annotations = buildExcludedSourceAnnotations([
      { price: 10, timestamp: 1000, confidence: 0.9, sources: ['chainlink'] },
      {
        price: 11,
        timestamp: 2000,
        confidence: 0.8,
        sources: ['chainlink'],
        qualityFlags: { stale: true },
        excludedSources: [
          { source: 'band', reportedPrice: 15, reason: 'outlier' },
          { source: 'reflector', reportedPrice: 12, reason: 'low confidence' },
        ],
      },
    ])

    expect(annotations).toHaveLength(1)
    expect(annotations[0]).toMatchObject({
      id: 'quality-event-2000',
      timestamp: 2000,
      label: 'Quality: stale',
      kind: 'quality',
    })
    expect(annotations[0].note).toContain('band: outlier (reported 15)')
    expect(annotations[0].note).toContain('reflector: low confidence (reported 12)')
  })

  it('marks only true upstream classifications and does not infer flags', () => {
    const annotations = buildExcludedSourceAnnotations([
      {
        price: 1,
        timestamp: 10,
        confidence: 1,
        sources: [],
        qualityFlags: { synthetic: false, stale: false, imputed: false },
      },
      {
        price: 1,
        timestamp: 20,
        confidence: 1,
        sources: [],
        qualityFlags: { imputed: true },
      },
    ])

    expect(annotations).toHaveLength(1)
    expect(annotations[0].label).toBe('Quality: imputed')
    expect(annotations[0].note).toBe('API reported imputed')
  })

  it('returns no markers when the API provides no incident metadata', () => {
    expect(buildExcludedSourceAnnotations([])).toEqual([])
    expect(buildExcludedSourceAnnotations([{ price: 1, timestamp: 0, confidence: 1, sources: [] }])).toEqual([])
  })
})
