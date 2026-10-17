import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import type { PriceHistoryEntry } from '../types/price'
import { buildSourceCoverageData } from './priceHistoryCoverage'

const entryArbitrary: fc.Arbitrary<PriceHistoryEntry> = fc.record({
  price: fc.double({ min: 0.000001, max: 1_000_000, noNaN: true }),
  timestamp: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  confidence: fc.double({ min: 0, max: 1, noNaN: true }),
  sources: fc.uniqueArray(fc.constantFrom('chainlink', 'redstone', 'band', 'reflector')),
})

describe('buildSourceCoverageData properties', () => {
  it('coverage ratios equal the reported source presence in every point', () => {
    fc.assert(
      fc.property(fc.array(entryArbitrary, { maxLength: 40 }), (entries) => {
        const { series, points } = buildSourceCoverageData(entries)

        for (const item of series) {
          const actualCount = entries.filter((entry) => entry.sources.includes(item.source)).length
          expect(item.coveredPoints).toBe(actualCount)
          expect(item.totalPoints).toBe(entries.length)
          expect(item.percent).toBe(entries.length === 0 ? 0 : (actualCount / entries.length) * 100)
        }

        for (let index = 0; index < entries.length; index++) {
          for (const item of series) {
            expect(points[index][item.dataKey]).toBe(entries[index].sources.includes(item.source) ? 100 : 0)
          }
        }
      }),
    )
  })
})
