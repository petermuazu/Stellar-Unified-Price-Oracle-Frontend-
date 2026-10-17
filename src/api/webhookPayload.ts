import { z } from 'zod'

export const WebhookTestPayloadSchema = z.object({
  type: z.literal('test'),
  message: z.string().min(1),
})

export const webhookTestPayload = {
  type: 'test',
  message: 'Test webhook from Stellar Price Oracle',
} as const

export function renderWebhookPayloadDocs(): string {
  const schema = z.toJSONSchema(WebhookTestPayloadSchema)
  const example = WebhookTestPayloadSchema.parse(webhookTestPayload)

  return `# Webhook payloads

## Test delivery

The application currently sends this test payload when a user selects **Send
test webhook**. The schema below is generated from the runtime Zod schema in
\`src/api/webhookPayload.ts\`.

\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

Example:

\`\`\`json
${JSON.stringify(example, null, 2)}
\`\`\`

This frontend does not define the production alert-delivery payload. Its schema
must be supplied by the upstream API before it can be documented here.
`
}
