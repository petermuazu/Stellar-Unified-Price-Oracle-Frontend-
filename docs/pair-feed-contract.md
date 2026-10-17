# Pair feed metadata contract

## Canonical pair units and scale

`GET /api/prices/:pair` may include `pairMetadata` on each price response:

```json
{
  "pairMetadata": {
    "baseUnit": "API-defined base unit",
    "quoteUnit": "API-defined quote unit",
    "priceScale": 8
  }
}
```

`baseUnit` and `quoteUnit` are canonical unit labels. `priceScale` is the
canonical decimal-place scale for the returned price and must be an integer
from 0 through 100. Each field may be `null` when the upstream contract cannot
establish it. The frontend displays supplied values verbatim and labels absent
or null values as unavailable; it does not derive unit semantics or scale from
pair symbols or on-chain proof precision.

The current API does not guarantee this metadata. Until the backend includes
the field, the detail page reports it as unavailable and pair cards omit the
metadata summary. No unit or scale is fabricated by the frontend.

## Provider feed-symbol directory

The same `pairMetadata` object may include a `feedSymbols` map keyed by
provider identifier. Each value reports `status` (`matched`, `renamed`,
`unknown`, or `missing`), `canonicalSymbol`, and `observedSymbol`. These values
must come from the backend's authoritative pair directory; the frontend does
not infer aliases from provider names or price data. Missing or unknown
metadata is shown as unavailable rather than treated as a successful match.

## Provider values and decimal precision

To compare provider precision, the price response may include `sourcePrices`
(finite numeric values keyed by provider) and `sourcePriceDecimals` (integer
decimal-place counts from 0 through 100, keyed by provider). The response must
also include `pairMetadata.priceScale` for normalization. The frontend formats
all supplied provider values at that shared scale and compares the API-reported
decimal counts with it; it does not infer provider precision from JavaScript
number formatting.

If provider values or the canonical scale are absent, the comparison reports
why it cannot be produced. If a provider's decimal count is absent, that row
shows precision as unavailable. The existing response timestamp is shown for
context; provider-specific timestamps are not represented by this contract.
The comparison uses the dashboard's existing two-minute aging threshold to
label an old aggregate snapshot as stale; it does not treat that label as a
provider-specific freshness measurement.
