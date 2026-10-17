# Price history gap annotations

The price chart highlights potential feed gaps when consecutive observed history
timestamps are more than 2.5 times the lower-half median interval in the
currently selected history range. The chart shades that span and lists its
observed endpoints and elapsed time.

This is a timestamp-based heuristic, not an upstream outage declaration. It
does not add, interpolate, or otherwise fabricate price data. Histories with
fewer than two timestamp intervals do not produce a gap annotation. Irregular
provider cadence can therefore cause false positives or leave a real outage
unmarked; authoritative outage intervals would require an explicit API field.
