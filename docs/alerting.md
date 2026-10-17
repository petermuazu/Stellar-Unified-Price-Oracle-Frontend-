# Alert behavior and evidence

## Fired-alert tick evidence

Alert history records the exact aggregate tick used for evaluation: its price,
timestamp, confidence, and contributing source names. When the feed supplies
per-source tick prices, those values are recorded too. The history disclosure
shows `Not provided by the price feed` when a field is absent; the client does
not infer or reconstruct per-source prices.

Older history entries remain readable and simply have no tick-evidence
disclosure. Per-source tick values are optional in the WebSocket contract
(`sourcePrices`) and may be absent from REST snapshots, so aggregate evidence
remains available even when source-level values are not.

## Rule evaluation timeline

The alert history panel includes a keyboard-operable, expandable evaluation
timeline. It records recent live checks (up to 200 in the current page session),
including fired/matched/not-matched outcomes and skipped checks such as
inactive or snoozed rules, unavailable price ticks, percentage-baseline resets,
and cooldowns. When conditions are evaluated, each leaf check shows its actual
and expected values. Missing prices are shown as unavailable rather than
substituted with a fabricated value.

The timeline is diagnostic session state, not a durable audit log; it resets
when the page reloads or the user clears alert history.

## Oracle source health notices

The current REST/WebSocket price contract reports which sources contributed to
an aggregate; it does not report authoritative per-source health. Notices are
therefore limited to client-observed participation changes: a source is
considered present if it appears in any fresh aggregate price snapshot (within
the default five-minute stale threshold). Notices explicitly say this is not an
upstream health report. Empty or stale snapshots do not imply a source
transition, and the current contract cannot report a `degraded` status.

Authoritative health-state alerts depend on an upstream source-health response
or event containing each source's status and observation timestamp, validated
by the API schema and exposed through `PriceContext`. No status or latency is
inferred in place of that missing contract.

## Threshold recovery notices

Each rule can opt into a recovery notice, disabled by default. When a previously
matching condition clears, the notice is shown in-app and routed through the
same enabled channels as the trigger (including `alert_recovered` webhooks).
The user preference is stored with the rule. A one-time rule that has fired
continues observing only for its recovery transition; it does not re-arm or
fire a second trigger. If no fresh price is available, the recovery state is
left pending until the next live evaluation instead of assuming the threshold
cleared.
