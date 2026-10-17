# Unified inbox

The `/inbox` view records price-alert fires, API/network status changes, and
community notices in one persistent list. The top and mobile navigation expose
the unread count. Messages can be filtered by category or unread state, grouped
by day, marked read individually or in bulk, and alert/system records link back
to their relevant price or status view.

Inbox read state is stored locally under `supo:inbox`. Entries older than 90
days are discarded and the list is capped at 250 newest entries. This is a
browser-local record; community notices added from the inbox are local notices,
not announcements distributed to other users.

Inbox recording is additive: alert notifications continue through their
existing immediate delivery channels. The inbox is a durable history, not a
replacement for critical alert delivery.
