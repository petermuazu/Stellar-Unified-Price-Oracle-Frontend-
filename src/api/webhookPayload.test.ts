import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderWebhookPayloadDocs, WebhookTestPayloadSchema, webhookTestPayload } from './webhookPayload'

describe('webhook payload schema documentation', () => {
  it('validates the payload used for test deliveries', () => {
    expect(WebhookTestPayloadSchema.parse(webhookTestPayload)).toEqual(webhookTestPayload)
  })

  it('keeps the generated reference in sync with the runtime schema', () => {
    const documentation = readFileSync(resolve(process.cwd(), 'docs/webhook-payloads.md'), 'utf8')
    expect(documentation).toBe(renderWebhookPayloadDocs())
  })
})
