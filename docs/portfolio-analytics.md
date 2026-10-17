# Portfolio analytics

The `/portfolio` page lets a user enter asset-pair holdings and amount held in
the base asset. Positions are stored locally in this browser only; the feature
does not connect a wallet, synchronize an account, or send holdings to the API.

Base exposure is grouped as held units. Quote exposure and total value include
only holdings with a fresh aggregate price. Prices older than two minutes,
future-dated prices, and missing prices are explicitly marked stale or
unavailable and excluded from quote-value totals. A failed refresh does not
turn stale data into a current valuation.
Entered pairs are fetched through the existing filtered prices API and refreshed
periodically while the page is open; the application does not assume that
every user-entered pair is already in the dashboard's tracked feed.

For each unique entered pair, price movement compares the current fresh
aggregate quote with the earliest available point returned by the existing
price-history API. Loading, empty history, failed requests, and stale history
are called out rather than replaced with estimated values. This is price
tracking only; it does not infer a portfolio cost basis or synchronize balances.

The provider outage scenario identifies fresh priced holdings whose current
aggregate lists the selected provider and reports their quote-currency
notional. It is not an outage loss estimate: the API has no source-specific
replacement quotes or health state. The spread stress lets the user enter an
assumed one-sided adverse percentage and calculates the corresponding
hypothetical notional reduction; it is explicitly not a measured spread or
forecast. Stale and unpriced holdings are excluded.

## API dependencies for advanced previews

Provider outage impact and historical aggregation-threshold recalculation need
data not currently provided by the frontend API. In particular, historical
price entries contain only aggregate price, confidence, and contributing
source names; they do not include per-provider observations, aggregation mode,
or the threshold parameters used at that timestamp. The interface must not
infer a simulated historical price from that summary. A future API contract
should expose validated per-source historical observations and the effective
aggregation configuration for each point, or provide a server-side history
simulation endpoint accepting a pair, time range, and candidate aggregation
threshold. The preview control stages a candidate value and shows the existing
history baseline, but never presents the baseline as a recalculated result.
Likewise, a quantitative outage-price estimate needs source-level prices and
the aggregation rule, not just provider membership.
