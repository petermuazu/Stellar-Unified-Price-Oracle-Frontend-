import { useMemo, useState } from 'react'
import type { SourceName } from '../types/price'
import type { ValuedHolding } from '../utils/portfolio'
import { modelPortfolioScenario } from '../utils/portfolioScenario'

const PROVIDERS: SourceName[] = ['chainlink', 'redstone', 'band', 'reflector']

function isProvider(value: string): value is SourceName {
  return PROVIDERS.some((provider) => provider === value)
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumSignificantDigits: 8 }).format(value)
}

export function PortfolioScenario({ holdings }: { holdings: readonly ValuedHolding[] }) {
  const [provider, setProvider] = useState<SourceName>('chainlink')
  const [wideningInput, setWideningInput] = useState('5')
  const wideningPercent = Number(wideningInput)
  const wideningIsValid =
    wideningInput.trim() !== '' && Number.isFinite(wideningPercent) && wideningPercent >= 0 && wideningPercent <= 100
  const scenario = useMemo(
    () => modelPortfolioScenario(holdings, provider, wideningIsValid ? wideningPercent : 0),
    [holdings, provider, wideningIsValid, wideningPercent],
  )

  return (
    <section
      aria-labelledby="portfolio-scenario-title"
      className="rounded-xl border border-gray-200 dark:border-gray-800"
    >
      <div className="bg-gray-50 p-4 dark:bg-gray-900">
        <h2 id="portfolio-scenario-title" className="font-semibold text-gray-900 dark:text-white">
          Provider and spread scenarios
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
          Outage exposure shows fresh holding notional whose aggregate price currently lists this provider. It does not
          estimate a replacement price or outage loss. Spread stress is an explicitly hypothetical, one-sided adverse
          move chosen below, not a live spread measurement or forecast.
        </p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Provider outage scenario
          <select
            value={provider}
            onChange={(event) => {
              if (isProvider(event.target.value)) setProvider(event.target.value)
            }}
            className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 focus-visible:outline-2 focus-visible:outline-cyan-600 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          >
            {PROVIDERS.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Assumed adverse widening (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={wideningInput}
            onChange={(event) => setWideningInput(event.target.value)}
            aria-describedby={wideningIsValid ? 'spread-assumption-note' : 'spread-assumption-error'}
            className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 focus-visible:outline-2 focus-visible:outline-cyan-600 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
        </label>
        {!wideningIsValid && (
          <p id="spread-assumption-error" role="alert" className="text-sm text-red-700 dark:text-red-300">
            Enter a finite assumption from 0% to 100%.
          </p>
        )}
        <p id="spread-assumption-note" className="text-sm text-gray-600 dark:text-gray-400 sm:col-span-2">
          Excluded from this model: {scenario.excludedHoldingCount} stale or unavailable holding(s). No prices are
          inferred for them.
        </p>
        <ImpactList
          title={`Current notional listing ${provider}`}
          emptyText={`No fresh priced holding currently lists ${provider} as a contributor.`}
          impacts={scenario.providerExposure}
        />
        <ImpactList
          title={`Hypothetical loss at ${wideningIsValid ? wideningPercent : '—'}%`}
          emptyText={
            holdings.length === 0
              ? 'Add holdings to model a spread stress.'
              : 'No fresh holding values are available for this stress scenario.'
          }
          impacts={wideningIsValid ? scenario.spreadStressLoss : []}
        />
      </div>
    </section>
  )
}

function ImpactList({
  title,
  emptyText,
  impacts,
}: {
  title: string
  emptyText: string
  impacts: Array<{ quoteAsset: string; amount: number }>
}) {
  return (
    <div aria-label={title} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
      {impacts.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {impacts.map(({ quoteAsset, amount }) => (
            <li key={quoteAsset} className="flex justify-between gap-3 text-sm">
              <span>{quoteAsset}</span>
              <span>{formatAmount(amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
