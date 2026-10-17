import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { renderWebhookPayloadDocs } = await vite.ssrLoadModule('/src/api/webhookPayload.ts')
  await writeFile(resolve('docs/webhook-payloads.md'), renderWebhookPayloadDocs())
} finally {
  await vite.close()
}
