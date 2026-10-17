import type { PriceQualityFlags } from '../types'

const QUALITY_LABELS: Array<{ key: keyof PriceQualityFlags; label: string }> = [
  { key: 'synthetic', label: 'Synthetic' },
  { key: 'stale', label: 'Stale' },
  { key: 'imputed', label: 'Imputed' },
]

export function PriceQualityDisclosure({ flags }: { flags?: PriceQualityFlags }) {
  const isReportedStale = flags?.stale === true

  return (
    <section
      className="rounded-lg border border-gray-700 bg-gray-800/40 p-4 text-sm"
      aria-labelledby="price-quality-heading"
    >
      <h2 id="price-quality-heading" className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-300">
        Value quality and treatment
      </h2>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {QUALITY_LABELS.map(({ key, label }) => {
          const value = flags?.[key]
          return (
            <div key={key}>
              <dt className="text-gray-400">{label}</dt>
              <dd className={value === true ? 'font-medium text-amber-300' : 'text-gray-200'}>
                {value === undefined ? 'Not reported by API' : value ? 'Reported: yes' : 'Reported: no'}
              </dd>
            </div>
          )
        })}
      </dl>
      <p className="mt-3 text-xs text-gray-400">
        These classifications are shown only when reported by the API. The frontend does not synthesize, impute,
        replace, or remove displayed prices; an absent flag is unknown, not a negative classification.
      </p>
      {isReportedStale && (
        <p className="mt-2 text-xs font-medium text-amber-300" role="status">
          The API marked this value stale. It is shown as reported and has not been refreshed or substituted here.
        </p>
      )}
    </section>
  )
}
