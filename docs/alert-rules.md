# Alert rule lifecycle and delivery

Expiry and review dates are optional local rule settings. An expiry date disables
the rule at the end of that calendar day in the user's local time zone; the rule
remains in the alert list and can be resumed, which clears the expired date.
Review dates only surface a due reminder in the alert panel and do not disable a
rule or send a notification. Missing live price data does not affect either
schedule.

Alert rules are stored in browser storage. These lifecycle fields are frontend
state and are not sent to an upstream API.

The alert panel supports selecting multiple non-archived rules to pause them,
change expiry/review dates, or archive them. A blank date clears that field only
when its corresponding "Change" checkbox is selected. Archived rules are retained
locally, skipped during evaluation, and can be restored paused from the Archived
tab. Restoring never silently re-enables a rule.

Before saving, the form validates locally configured channels, session-only bot
secrets, and browser notification support/permission. Email and webhook readiness
is configuration-only: the frontend does not probe remote endpoints, so an
upstream readiness/health contract is required before remote delivery can be
reported as verified.

Alert delivery records are connected to the frontend's dispatch path. Each
configured channel is attempted up to four times with exponential backoff, and
the alert panel shows the latest attempt sequence and its accepted/failed
outcomes. These receipts are in-memory and session-only; reloading or closing
the page discards them. HTTP success and browser notification acceptance are
reported as accepted by that endpoint/browser, not proof of final user receipt.
Durable delivery history and authoritative provider delivery/retry outcomes
require an upstream receipt API; no server-side history is fabricated.
