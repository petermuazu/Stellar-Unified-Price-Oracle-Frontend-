import { z } from 'zod'
import type { PriceData } from '../types'
import { VALID_PAIRS } from '../types'

export const NUMERAIRE_OPTIONS = ['USD', 'XLM', 'BTC', 'ETH', 'USDC'] as const
export type PortfolioNumeraire = (typeof NUMERAIRE_OPTIONS)[number]

export interface PortfolioHolding {
  id: string
  pair: string
  quantity: number
}

export interface PortfolioValuationRow {
  holding: PortfolioHolding
  value: number | null
  rate: number | null
  quoteTimestamp: number | null
  sourcePairs: string[]
  stale: boolean
  unavailableReason?: string
}

export interface PortfolioValuation {
  rows: PortfolioValuationRow[]
  total: number | null
  stale: boolean
}

export interface PortfolioSnapshot {
  id: string
  capturedAt: number
  numeraire: PortfolioNumeraire
  total: number
  stale: boolean
  holdings: Array<{
    pair: string
    quantity: number
    value: number
    rate: number
    quoteTimestamp: number | null
    sourcePairs: string[]
    stale: boolean
  }>
}

export interface PortfolioStore {
  numeraire: PortfolioNumeraire
  holdings: PortfolioHolding[]
  snapshots: PortfolioSnapshot[]
}

export const EMPTY_PORTFOLIO: PortfolioStore = {
  numeraire: 'USD',
  holdings: [],
  snapshots: [],
}

const numeraireSchema = z.enum(NUMERAIRE_OPTIONS)
const holdingSchema = z.object({
  id: z.string().min(1),
  pair: z.string().refine((pair) => VALID_PAIRS.includes(pair)),
  quantity: z.number().finite().positive(),
})
const snapshotSchema = z.object({
  id: z.string().min(1),
  capturedAt: z.number().int().nonnegative(),
  numeraire: numeraireSchema,
  total: z.number().finite().nonnegative(),
  stale: z.boolean(),
  holdings: z.array(
    z.object({
      pair: z.string().refine((pair) => VALID_PAIRS.includes(pair)),
      quantity: z.number().finite().positive(),
      value: z.number().finite().nonnegative(),
      rate: z.number().finite().positive(),
      quoteTimestamp: z.number().int().nonnegative().nullable(),
      sourcePairs: z.array(z.string()),
      stale: z.boolean(),
    }),
  ),
})

export const PortfolioStoreSchema = z.object({
  numeraire: numeraireSchema,
  holdings: z.array(holdingSchema),
  snapshots: z.array(snapshotSchema),
})

function findUsablePrice(pair: string, prices: PriceData[], nowMs: number): PriceData | null {
  const price = prices.find((entry) => entry.assetPair === pair)
  if (!price || !Number.isFinite(price.price) || price.price <= 0) return null
  if (!Number.isFinite(price.timestamp) || price.timestamp < 0 || price.timestamp > nowMs) return null
  return price
}

/**
 * Values holdings through direct `/USD` oracle pairs, then converts to the
 * selected numeraire using its own `/USD` pair. No peg or missing rate is assumed.
 */
export function calculatePortfolioValuation(
  holdings: PortfolioHolding[],
  prices: PriceData[],
  numeraire: PortfolioNumeraire,
  staleAfterMs: number,
  nowMs: number = Date.now(),
): PortfolioValuation {
  const rows = holdings.map((holding): PortfolioValuationRow => {
    const asset = holding.pair.split('/')[0]
    if (asset === numeraire) {
      return {
        holding,
        value: holding.quantity,
        rate: 1,
        quoteTimestamp: null,
        sourcePairs: [],
        stale: false,
      }
    }

    const assetPrice = findUsablePrice(`${asset}/USD`, prices, nowMs)
    if (!assetPrice) {
      return {
        holding,
        value: null,
        rate: null,
        quoteTimestamp: null,
        sourcePairs: [],
        stale: false,
        unavailableReason: `No valid ${asset}/USD oracle price is available.`,
      }
    }

    const numerairePrice = numeraire === 'USD' ? null : findUsablePrice(`${numeraire}/USD`, prices, nowMs)
    if (numeraire !== 'USD' && !numerairePrice) {
      return {
        holding,
        value: null,
        rate: null,
        quoteTimestamp: null,
        sourcePairs: [assetPrice.assetPair],
        stale: false,
        unavailableReason: `No valid ${numeraire}/USD oracle price is available for conversion.`,
      }
    }

    const rate = numerairePrice ? assetPrice.price / numerairePrice.price : assetPrice.price
    const value = holding.quantity * rate
    if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(value)) {
      return {
        holding,
        value: null,
        rate: null,
        quoteTimestamp: null,
        sourcePairs: numerairePrice ? [assetPrice.assetPair, numerairePrice.assetPair] : [assetPrice.assetPair],
        stale: false,
        unavailableReason: 'Oracle prices did not produce a finite valuation.',
      }
    }

    const quoteTimestamp = numerairePrice
      ? Math.min(assetPrice.timestamp, numerairePrice.timestamp)
      : assetPrice.timestamp
    const stale =
      nowMs - assetPrice.timestamp > staleAfterMs ||
      assetPrice.qualityFlags?.stale === true ||
      (numerairePrice !== null &&
        (nowMs - numerairePrice.timestamp > staleAfterMs || numerairePrice.qualityFlags?.stale === true))

    return {
      holding,
      value,
      rate,
      quoteTimestamp,
      sourcePairs: numerairePrice ? [assetPrice.assetPair, numerairePrice.assetPair] : [assetPrice.assetPair],
      stale,
    }
  })

  const isComplete = rows.length > 0 && rows.every((row) => row.value !== null)
  const computedTotal = isComplete ? rows.reduce((sum, row) => sum + (row.value ?? 0), 0) : null
  return {
    rows,
    total: computedTotal !== null && Number.isFinite(computedTotal) ? computedTotal : null,
    stale: rows.some((row) => row.stale),
  }
}

export function createPortfolioSnapshot(
  id: string,
  capturedAt: number,
  numeraire: PortfolioNumeraire,
  valuation: PortfolioValuation,
): PortfolioSnapshot | null {
  if (valuation.total === null || !Number.isFinite(valuation.total)) return null
  if (valuation.rows.some((row) => row.value === null || row.rate === null)) return null

  const holdings: PortfolioSnapshot['holdings'] = []
  for (const row of valuation.rows) {
    if (row.value === null || row.rate === null) return null
    holdings.push({
      pair: row.holding.pair,
      quantity: row.holding.quantity,
      value: row.value,
      rate: row.rate,
      quoteTimestamp: row.quoteTimestamp,
      sourcePairs: [...row.sourcePairs],
      stale: row.stale,
    })
  }

  return {
    id,
    capturedAt,
    numeraire,
    total: valuation.total,
    stale: valuation.stale,
    holdings,
  }
}
