# Local portfolio valuation snapshots

The portfolio page stores asset quantities and manual valuation snapshots in
the browser's existing IndexedDB `preferences` store. It does not submit
holdings to the oracle and does not persist them in plain-text `localStorage`.
The data is device/browser-local and is removed by the app's clear-data flow.

Holdings are denominated in one of the existing tracked `/USD` pairs. USD
valuation uses that pair's reported price. Other numeraires use the ratio of
the holding's `/USD` price to the selected numeraire's `/USD` price. Even USDC
uses its observed oracle quote; no peg is assumed. A holding in the selected
numeraire is valued at its entered quantity without a conversion rate.

Missing, invalid, future-dated, or non-positive rates leave that holding
unavailable and suppress the portfolio total and snapshot action. Stale rates
(older than the user's configured stale threshold or explicitly marked stale by
the API) remain visible with a stale warning; snapshots preserve each rate,
source pair, quote timestamp, and stale marker. The newest 50 snapshots are
retained locally. No backend/API changes are required.
