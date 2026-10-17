import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { METRIC_HELP_TOPICS, metricHelpDocsHref, type MetricHelpTopic } from '../data/metricHelp'
import { trackAnalytics } from '../utils/analytics'

export function MetricHelp({ topic }: { topic: MetricHelpTopic }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const popoverId = useId()
  const definition = METRIC_HELP_TOPICS[topic]
  const title = t(definition.titleKey)

  useEffect(() => {
    if (!open) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        className="ms-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-500 text-[11px] font-semibold text-gray-400 hover:text-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500"
        aria-label={t('metricHelp.helpFor', { topic: title })}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => {
          if (!open) trackAnalytics('engagement', 'metric_help_open', { topic })
          setOpen((value) => !value)
        }}
      >
        <span aria-hidden="true">?</span>
      </button>
      {open && (
        <span
          id={popoverId}
          role="region"
          aria-label={title}
          className="absolute start-0 top-full z-40 mt-2 w-64 rounded-lg border border-gray-700 bg-gray-900 p-3 text-start text-xs text-gray-200 shadow-xl"
        >
          <span className="block font-semibold text-white">{title}</span>
          <span className="mt-1 block leading-relaxed">{t(definition.descriptionKey)}</span>
          <Link
            to={metricHelpDocsHref(topic)}
            className="mt-2 inline-block text-cyan-400 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500"
          >
            {t('metricHelp.readDocs')}
          </Link>
        </span>
      )}
    </span>
  )
}
