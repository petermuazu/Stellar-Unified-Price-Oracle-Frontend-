# Benchmark and data-quality transparency

## Reference benchmark freshness and provenance

The price detail benchmark card displays the observation timestamp and provider
only when the independent benchmark API reports them. Observations older than
two minutes are labelled stale; a missing pair-matched observation is shown as
unavailable, not replaced with the aggregate price. Benchmark data remains
read-only and never contributes to the displayed aggregate.

The frontend expects `GET /api/reference-price?pair=<asset-pair>` to return an
array of pair-scoped observations:

```json
{
  "pair": "XLM/USD",
  "timestamp": "2026-10-15T18:45:00.000Z",
  "price": 0.31,
  "source": "reference-provider"
}
```

`pair`, a parseable ISO-8601 `timestamp`, and finite `price` are required.
`source` is optional; if omitted, the UI says that provenance was not reported.
The frontend filters observations to the requested pair. The backend must add
pair scoping and source provenance if its current endpoint does not provide
them; the frontend does not infer either value.

## Historical data-quality incidents

Price-history points that include `excludedSources` are marked on the affected
pair's chart as **Source excluded**. The marker note lists the excluded source,
reported price, and upstream reason from that exact history record. These
markers are API-derived, are not user-dismissible, and are not generated for
history points without exclusion metadata. When the history API omits
`excludedSources`, the chart has no incident markers; the frontend does not
infer incidents from price movements or confidence scores.

## Synthetic, stale, and imputed values

The price detail view and historical chart tooltip expose the API's optional
`qualityFlags` object. Each of `synthetic`, `stale`, and `imputed` is shown as
reported yes/no, or as **Not reported by API** when absent. Missing metadata is
not treated as false. Historical points with a true flag receive a chart marker;
false or absent flags do not. The frontend does not remove, replace, synthesize,
or impute a reported price based on these classifications; it preserves the
upstream value and labels the classification.

For complete disclosure, the upstream API must include `qualityFlags` on
`GET /api/prices/:pair`, each `GET /api/prices/:pair/history` entry, and
WebSocket `price_update` messages when known:

```json
{
  "synthetic": false,
  "stale": true,
  "imputed": false
}
```

Each flag is optional because upstream classification may be unknown. The
backend must define and supply the authoritative classification; the frontend
does not infer it from the price, confidence, timestamp, or source count.
