import assert from 'node:assert/strict'
import test from 'node:test'
import {
  enqueueCheckin,
  readOffline,
  rememberScope,
  retryCheckins,
  syncCheckins,
  STORAGE_KEY,
} from '../public/offline-store.mjs'

const SCOPE = 'a'.repeat(64)
const OTHER = 'b'.repeat(64)
function memory() {
  const data = new Map()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
}
const response = (status, body = {}) => new Response(JSON.stringify(body), { status })
const result = {
  checkedInAt: '2026-10-30T12:00:00Z',
  alreadyCheckedIn: false,
  nickname: 'visitante',
  progress: { visited: 1, total: 2 },
  event: { slug: 'snct', name: 'SNCT' },
}

test('deduplicates offline QR visits and persists only scope plus public visit metadata', () => {
  const storage = memory()
  rememberScope(storage, SCOPE)
  enqueueCheckin(storage, SCOPE, 'public-checkpoint')
  enqueueCheckin(storage, SCOPE, 'public-checkpoint')
  assert.equal(readOffline(storage).entries.length, 1)
  assert.equal(readOffline(storage).entries[0].status, 'pending')
  const raw = JSON.parse(storage.getItem(STORAGE_KEY))
  assert.deepEqual(Object.keys(raw).sort(), ['entries', 'scope', 'version'])
  assert.deepEqual(Object.keys(raw.entries[0]).sort(), [
    'attempts',
    'createdAt',
    'qrToken',
    'status',
  ])
  assert.throws(() => enqueueCheckin(storage, SCOPE, '../admin'))
})

test('lost response remains pending and replay confirms one idempotent server stamp', async () => {
  const storage = memory()
  rememberScope(storage, SCOPE)
  enqueueCheckin(storage, SCOPE, 'checkpoint-a')
  let requests = 0
  const serverStamps = new Set()
  const fetcher = async (url, options) => {
    if (url.endsWith('/session')) return response(200, { scope: SCOPE })
    const body = JSON.parse(options.body)
    assert.deepEqual(body, { qrToken: 'checkpoint-a', scope: SCOPE })
    serverStamps.add(body.qrToken)
    requests++
    if (requests === 1) throw new Error('response lost after commit')
    return response(200, { result: { ...result, alreadyCheckedIn: true } })
  }
  await syncCheckins(storage, fetcher)
  assert.equal(readOffline(storage).entries[0].status, 'pending')
  let received
  await syncCheckins(storage, fetcher, (_token, value) => {
    received = value
  })
  assert.equal(readOffline(storage).entries[0].status, 'synced')
  assert.equal(serverStamps.size, 1)
  assert.equal(received.alreadyCheckedIn, true)
  assert.ok(!storage.getItem(STORAGE_KEY).includes('nickname'))
})

test('invalid point exposes an error and retries only after explicit retry', async () => {
  const storage = memory()
  rememberScope(storage, SCOPE)
  enqueueCheckin(storage, SCOPE, 'closed-checkpoint')
  let posts = 0
  const fetcher = async (url) =>
    url.endsWith('/session')
      ? response(200, { scope: SCOPE })
      : (posts++, response(422, { error: 'Ponto desativado.' }))
  await syncCheckins(storage, fetcher)
  assert.equal(readOffline(storage).entries[0].status, 'error')
  assert.equal(readOffline(storage).entries[0].message, 'Ponto desativado.')
  await syncCheckins(storage, fetcher)
  assert.equal(posts, 1)
  retryCheckins(storage)
  await syncCheckins(storage, fetcher)
  assert.equal(posts, 2)
})

test('a changed device session discards the previous queue without delivering it to the next visitor', async () => {
  const storage = memory()
  rememberScope(storage, SCOPE)
  enqueueCheckin(storage, SCOPE, 'checkpoint-a')
  let posts = 0
  await syncCheckins(storage, async (url) => {
    if (url.endsWith('/session')) return response(200, { scope: OTHER })
    posts++
    return response(200, { result })
  })
  assert.equal(posts, 0)
  assert.deepEqual(readOffline(storage), { scope: OTHER, entries: [] })
})

test('a session switch between verification and POST blocks all remaining queued visits', async () => {
  const storage = memory()
  rememberScope(storage, SCOPE)
  enqueueCheckin(storage, SCOPE, 'checkpoint-a')
  enqueueCheckin(storage, SCOPE, 'checkpoint-b')
  let sessions = 0
  let posts = 0
  await syncCheckins(storage, async (url) => {
    if (url.endsWith('/session')) return response(200, { scope: ++sessions === 1 ? SCOPE : OTHER })
    posts++
    return response(409)
  })
  assert.equal(posts, 1)
  assert.deepEqual(readOffline(storage), { scope: OTHER, entries: [] })
})

test('revoked session clears local visits; unavailable server keeps them pending', async () => {
  const storage = memory()
  rememberScope(storage, SCOPE)
  enqueueCheckin(storage, SCOPE, 'checkpoint-a')
  await assert.rejects(syncCheckins(storage, async () => response(503)))
  assert.equal(readOffline(storage).entries.length, 1)
  await syncCheckins(storage, async () => response(401))
  assert.deepEqual(readOffline(storage), { scope: null, entries: [] })
})

test('unavailable storage fails visibly instead of claiming a visit was saved', () => {
  const storage = memory()
  rememberScope(storage, SCOPE)
  storage.setItem = () => {
    throw new Error('quota')
  }
  assert.throws(() => enqueueCheckin(storage, SCOPE, 'checkpoint-a'), /quota/)
})
