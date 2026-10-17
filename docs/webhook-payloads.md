# Webhook payloads

## Test delivery

The application currently sends this test payload when a user selects **Send
test webhook**. The schema below is generated from the runtime Zod schema in
`src/api/webhookPayload.ts`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "const": "test"
    },
    "message": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "type",
    "message"
  ],
  "additionalProperties": false
}
```

Example:

```json
{
  "type": "test",
  "message": "Test webhook from Stellar Price Oracle"
}
```

This frontend does not define the production alert-delivery payload. Its schema
must be supplied by the upstream API before it can be documented here.
