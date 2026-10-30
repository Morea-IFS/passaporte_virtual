import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const script = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')
function worker(fetcher = async () => new Response('asset')) {
  const handlers = new Map()
  const puts = []
  const shell = new Response('offline shell')
  const assets = new Map()
  const deletedCaches = []
  const context = {
    URL,
    Response,
    fetch: fetcher,
    self: {
      location: { origin: 'https://passport.test' },
      addEventListener: (name, fn) => handlers.set(name, fn),
      clients: { claim: async () => {} },
    },
    caches: {
      match: async () => shell,
      keys: async () => ['pv-static-v1', 'pv-static-v2', 'unrelated-app'],
      delete: async (key) => {
        deletedCaches.push(key)
        return true
      },
      open: async () => ({
        match: async (request) => assets.get(request.url)?.clone(),
        put: async (request, response) => {
          puts.push([request, response])
          assets.set(request.url, response)
        },
      }),
    },
  }
  vm.runInNewContext(script, context)
  return {
    puts,
    deletedCaches,
    activate() {
      let promise
      handlers.get('activate')({
        waitUntil: (value) => {
          promise = value
        },
      })
      return promise
    },
    fetch(path, overrides = {}) {
      let promise
      handlers.get('fetch')({
        request: { url: `https://passport.test${path}`, method: 'GET', mode: 'cors', ...overrides },
        respondWith: (value) => {
          promise = value
        },
      })
      return promise
    },
  }
}

test('never intercepts API, authentication, admin, POST or RSC for caching', () => {
  const sw = worker()
  for (const path of [
    '/api/offline/session',
    '/api/offline/checkins',
    '/admin',
    '/admin/eventos',
    '/recuperar',
  ])
    assert.equal(sw.fetch(path), undefined)
  assert.equal(sw.fetch('/c/qr', { method: 'POST' }), undefined)
  assert.equal(sw.fetch('/passaporte/snct?_rsc=1'), undefined)
  assert.equal(sw.fetch('/c/checkpoint'), undefined)
  assert.equal(sw.puts.length, 0)
})

test('unknown visitor QR navigation returns the static shell when network fails', async () => {
  const sw = worker(async () => {
    throw new Error('offline')
  })
  const result = await sw.fetch('/c/never-opened-checkpoint', { mode: 'navigate' })
  assert.equal(await result.text(), 'offline shell')
  assert.equal(sw.puts.length, 0)
})

test('online personalized document is passed through without writing it to Cache Storage', async () => {
  const sw = worker(async () => new Response('private recovery details'))
  const result = await sw.fetch('/passaporte/snct?bemvindo=1', { mode: 'navigate' })
  assert.equal(await result.text(), 'private recovery details')
  assert.equal(sw.puts.length, 0)
})

test('server outage uses the offline shell without caching the failing personalized response', async () => {
  const sw = worker(async () => new Response('upstream unavailable', { status: 503 }))
  const result = await sw.fetch('/c/checkpoint', { mode: 'navigate' })
  assert.equal(await result.text(), 'offline shell')
  assert.equal(sw.puts.length, 0)
})

function basicResponse(body, cacheControl) {
  const response = new Response(body, {
    headers: cacheControl ? { 'Cache-Control': cacheControl } : {},
  })
  Object.defineProperty(response, 'type', { value: 'basic' })
  return response
}

test('mutable development chunks always use the network and never enter Cache Storage', async () => {
  for (const cacheControl of [undefined, 'no-store, must-revalidate', 'public, max-age=31536000']) {
    let requests = 0
    const sw = worker(async () => basicResponse(`factory-${++requests}`, cacheControl))
    const first = await sw.fetch('/_next/static/chunks/app-layout.js')
    const changed = await sw.fetch('/_next/static/chunks/app-layout.js')
    assert.equal(await first.text(), 'factory-1')
    assert.equal(await changed.text(), 'factory-2')
    assert.equal(requests, 2)
    assert.equal(sw.puts.length, 0)
  }
})

test('immutable production chunks are cached and reused without a second network request', async () => {
  let requests = 0
  const sw = worker(async () => {
    requests++
    return basicResponse('production factory', 'public, max-age=31536000, immutable')
  })
  const first = await sw.fetch('/_next/static/chunks/a1b2c3.js')
  const second = await sw.fetch('/_next/static/chunks/a1b2c3.js')
  assert.equal(await first.text(), 'production factory')
  assert.equal(await second.text(), 'production factory')
  assert.equal(requests, 1)
  assert.equal(sw.puts.length, 1)
})

test('public offline shell remains cacheable without an immutable header', async () => {
  let requests = 0
  const sw = worker(async () => {
    requests++
    return basicResponse('public offline shell', 'public, max-age=0')
  })
  await sw.fetch('/offline.html')
  const second = await sw.fetch('/offline.html')
  assert.equal(await second.text(), 'public offline shell')
  assert.equal(requests, 1)
  assert.equal(sw.puts.length, 1)
})

test('cache v2 activation removes old mutable caches and preserves other applications', async () => {
  const sw = worker()
  await sw.activate()
  assert.deepEqual(sw.deletedCaches, ['pv-static-v1'])
})
