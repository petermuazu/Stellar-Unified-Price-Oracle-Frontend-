import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
  appType: 'custom',
})
let server

try {
  const { OracleClient } = await vite.ssrLoadModule('/src/sdk/client.ts')
  server = spawn(process.execPath, ['scripts/sdk-fixture-server.mjs'], {
    env: { ...process.env, SDK_FIXTURE_PORT: '0' },
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  const baseUrl = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('SDK fixture server did not start')), 5000)
    server.stdout.setEncoding('utf8')
    server.stdout.on('data', (chunk) => {
      const match = chunk.match(/SDK fixture server listening at (http:\/\/127\.0\.0\.1:\d+)/)
      if (!match) return
      clearTimeout(timeout)
      resolve(match[1])
    })
    server.once('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    server.once('exit', (code) => {
      clearTimeout(timeout)
      reject(new Error(`SDK fixture server exited before startup (code ${code})`))
    })
  })
  const client = new OracleClient({ baseUrl })
  const prices = await client.getPrices()
  if (prices.length !== 2) throw new Error('Expected two fixture prices')
  const price = await client.getPrice('XLM-USD')
  if (price.price !== 0.12) throw new Error('Unexpected XLM-USD fixture')
  const history = await client.getHistory('XLM-USD')
  if (history.history.length !== 3) throw new Error('Expected three fixture history entries')
  const alert = await client.createAlert({ assetPair: 'XLM-USD', upperThreshold: 1.25 })
  if (alert.id !== 'fixture-alert-1') throw new Error('Unexpected fixture alert response')
  console.log('SDK fixture smoke test passed')
} finally {
  if (server && server.exitCode === null) {
    server.kill()
    await Promise.race([once(server, 'exit'), delay(1000)])
  }
  await vite.close()
}
