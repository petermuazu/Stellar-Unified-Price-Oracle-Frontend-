# Per-source price-history coverage

The price-history chart's **Coverage** control shows a step overlay for each
oracle reported in the selected history range. A point is covered only when
that entry's `sources` array includes the oracle. The legend reports the share
of returned aggregate points with that source, and the accessible data table
exposes per-point contributor status.

This is observed contributor coverage in the returned history, not source
uptime, request success, or an estimate of missing upstream ticks. The
calculation uses only API-reported `sources`; entries with no reported
contributors produce zero coverage for all displayed sources. If no point
contains contributor metadata, the chart explicitly reports coverage as
unavailable. No additional API fields or fabricated values are used.
