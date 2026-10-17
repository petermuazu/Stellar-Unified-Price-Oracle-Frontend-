export const METRIC_HELP_TOPICS = {
  confidence: {
    titleKey: 'metricHelp.topics.confidence.title',
    descriptionKey: 'metricHelp.topics.confidence.description',
    docsAnchor: 'metric-help-confidence',
  },
  divergence: {
    titleKey: 'metricHelp.topics.divergence.title',
    descriptionKey: 'metricHelp.topics.divergence.description',
    docsAnchor: 'metric-help-divergence',
  },
  staleness: {
    titleKey: 'metricHelp.topics.staleness.title',
    descriptionKey: 'metricHelp.topics.staleness.description',
    docsAnchor: 'metric-help-staleness',
  },
  weights: {
    titleKey: 'metricHelp.topics.weights.title',
    descriptionKey: 'metricHelp.topics.weights.description',
    docsAnchor: 'metric-help-weights',
  },
} as const

export type MetricHelpTopic = keyof typeof METRIC_HELP_TOPICS

export function metricHelpDocsHref(topic: MetricHelpTopic): string {
  return `/api-docs#${METRIC_HELP_TOPICS[topic].docsAnchor}`
}
