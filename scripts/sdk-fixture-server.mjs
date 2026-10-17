import { createServer } from 'node:http'

const port = Number(process.env.SDK_FIXTURE_PORT ?? 4178)
const fixtures = {
  'XLM-USD': {
    assetPair: 'XLM-USD',
    price: 0.12,
    timestamp: 1_735_689_600_000,
    confidence: 0.99,
    sources: ['fixture'],
  },
  'BTC-USD': {
    assetPair: 'BTC-USD',
    price: 67_000,
    timestamp: 1_735_689_600_000,
    confidence: 0.98,
    sources: ['fixture'],
  },
}

function json(response, status, payload) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key',
    'Content-Type': 'application/json',
  })
  response.end(JSON.stringify(payload))
}

async function readJson(request) {
  let body = ''
  for await (const chunk of request) body += chunk
  return JSON.parse(body)
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key',
    })
    response.end()
    return
  }

  const url = new URL(request.url ?? '/', 'http://127.0.0.1')
  if (request.method === 'GET' && url.pathname === '/api/version') {
    json(response, 200, { version: '1.0.0', serverVersion: '1.0.0' })
    return
  }
  if (request.method === 'GET' && url.pathname === '/api/prices') {
    json(response, 200, Object.values(fixtures))
    return
  }

  const historyMatch = url.pathname.match(/^\/api\/prices\/([^/]+)\/history$/)
  if (request.method === 'GET' && historyMatch) {
    const assetPair = decodeURIComponent(historyMatch[1])
    if (!fixtures[assetPair]) {
      json(response, 404, { code: 'not_found', message: `Unknown fixture pair: ${assetPair}` })
      return
    }
    const price = fixtures[assetPair]
    const limit = Math.max(0, Number(url.searchParams.get('limit') ?? 100))
    const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0))
    const history = Array.from({ length: 3 }, (_, index) => ({
      price: price.price * (1 + index / 100),
      timestamp: price.timestamp - index * 60_000,
      confidence: price.confidence,
      sources: price.sources,
    })).slice(offset, offset + limit)
    json(response, 200, { pair: assetPair, history })
    return
  }

  const priceMatch = url.pathname.match(/^\/api\/prices\/([^/]+)$/)
  if (request.method === 'GET' && priceMatch) {
    const assetPair = decodeURIComponent(priceMatch[1])
    const price = fixtures[assetPair]
    json(
      response,
      price ? 200 : 404,
      price ?? { code: 'not_found', message: `Unknown fixture pair: ${assetPair}` },
    )
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/alerts') {
    let input
    try {
      input = await readJson(request)
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
      json(response, 400, { code: 'bad_request', message: 'Request body must be valid JSON' })
      return
    }
    json(response, 201, { id: 'fixture-alert-1', ...input })
    return
  }

  json(response, 404, { code: 'not_found', message: 'Fixture route not found' })
})

server.listen(port, '127.0.0.1', () => {
  const address = server.address()
  if (address && typeof address === 'object') {
    console.log(`SDK fixture server listening at http://127.0.0.1:${address.port}`)
  }
})
