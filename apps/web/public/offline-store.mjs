/** Shared by React and the independent offline document. Never stores visitor credentials. */
export const STORAGE_KEY = 'pv-offline-v1'
export const CHANGE_EVENT = 'pv-offline-change'
export const RESULT_EVENT = 'pv-offline-result'
const TOKEN = /^[A-Za-z0-9_-]{1,64}$/
const SCOPE = /^[a-f0-9]{64}$/

export function readOffline(storage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) || 'null')
    if (value?.version !== 1 || !SCOPE.test(value.scope)) return { scope: null, entries: [] }
    return {
      scope: value.scope,
      entries: (Array.isArray(value.entries) ? value.entries : [])
        .filter(
          (entry) =>
            entry &&
            typeof entry.qrToken === 'string' &&
            TOKEN.test(entry.qrToken) &&
            ['pending', 'synced', 'error'].includes(entry.status) &&
            typeof entry.createdAt === 'string'
        )
        .map((entry) => ({
          qrToken: entry.qrToken,
          status: entry.status,
          createdAt: entry.createdAt,
          attempts:
            Number.isSafeInteger(entry.attempts) && entry.attempts >= 0 ? entry.attempts : 0,
          ...(typeof entry.checkedInAt === 'string' ? { checkedInAt: entry.checkedInAt } : {}),
          ...(typeof entry.message === 'string' ? { message: entry.message.slice(0, 500) } : {}),
        })),
    }
  } catch {
    return { scope: null, entries: [] }
  }
}

function announce() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

function save(storage, state) {
  // Retain every unconfirmed visit, and only the 30 most recent confirmations.
  const confirmed = state.entries.filter((entry) => entry.status === 'synced').slice(-30)
  const entries = [...state.entries.filter((entry) => entry.status !== 'synced'), ...confirmed]
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, scope: state.scope, entries }))
  announce()
}

export function forgetOffline(storage) {
  storage.removeItem(STORAGE_KEY)
  announce()
}

export function rememberScope(storage, scope) {
  if (!SCOPE.test(scope)) throw new Error('Sessão inválida.')
  const state = readOffline(storage)
  if (state.scope !== scope) save(storage, { scope, entries: [] })
  return scope
}

export function enqueueCheckin(storage, scope, qrToken) {
  if (!TOKEN.test(qrToken)) throw new Error('O QR code não é válido.')
  const state = readOffline(storage)
  if (!scope || state.scope !== scope)
    throw new Error('Conecte-se para identificar seu passaporte.')
  const existing = state.entries.find((entry) => entry.qrToken === qrToken)
  if (existing && existing.status !== 'error') return existing
  const entry = {
    qrToken,
    status: 'pending',
    createdAt: existing?.createdAt || new Date().toISOString(),
    attempts: existing?.attempts || 0,
  }
  state.entries = state.entries.filter((item) => item.qrToken !== qrToken)
  state.entries.push(entry)
  save(storage, state) // A quota/privacy failure must reach the UI; never claim it was saved.
  return entry
}

export function retryCheckins(storage) {
  const state = readOffline(storage)
  if (!state.scope) return
  state.entries = state.entries.map((entry) =>
    entry.status === 'error' ? { ...entry, status: 'pending', message: undefined } : entry
  )
  save(storage, state)
}

function updateEntry(storage, scope, qrToken, patch) {
  const state = readOffline(storage)
  if (state.scope !== scope) return false
  state.entries = state.entries.map((entry) =>
    entry.qrToken === qrToken ? { ...entry, ...patch } : entry
  )
  save(storage, state)
  return true
}

export async function refreshOfflineSession(storage, fetcher = fetch) {
  const response = await fetcher('/api/offline/session', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (response.status === 401) {
    forgetOffline(storage)
    return null
  }
  if (!response.ok) throw new Error('Não foi possível verificar seu passaporte agora.')
  const { scope } = await response.json()
  return rememberScope(storage, scope)
}

let running
/** At-least-once delivery; the server's visitor/checkpoint constraint makes retries idempotent. */
export function syncCheckins(storage, fetcher = fetch, onResult = () => {}) {
  if (running) return running
  running = synchronize(storage, fetcher, onResult).finally(() => {
    running = undefined
  })
  return running
}

async function synchronize(storage, fetcher, onResult) {
  const scope = await refreshOfflineSession(storage, fetcher)
  if (!scope) return
  const pending = readOffline(storage).entries.filter((entry) => entry.status === 'pending')
  for (const entry of pending) {
    if (readOffline(storage).scope !== scope) return
    let response
    try {
      response = await fetcher('/api/offline/checkins', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: entry.qrToken, scope }),
      })
    } catch {
      updateEntry(storage, scope, entry.qrToken, {
        status: 'pending',
        attempts: entry.attempts + 1,
        message: 'Aguardando conexão. O carimbo ainda não foi confirmado.',
      })
      return
    }
    if (response.status === 401 || response.status === 409) {
      // No further send is allowed with the previous device session.
      await refreshOfflineSession(storage, fetcher)
      return
    }
    const body = await response.json().catch(() => ({}))
    if (response.ok) {
      if (
        updateEntry(storage, scope, entry.qrToken, {
          status: 'synced',
          checkedInAt: body.result.checkedInAt,
          attempts: entry.attempts + 1,
          message: undefined,
        })
      ) {
        onResult(entry.qrToken, body.result)
        if (typeof window !== 'undefined')
          window.dispatchEvent(
            new CustomEvent(RESULT_EVENT, {
              detail: { qrToken: entry.qrToken, result: body.result },
            })
          )
      }
    } else if (response.status === 400 || response.status === 404 || response.status === 422) {
      updateEntry(storage, scope, entry.qrToken, {
        status: 'error',
        attempts: entry.attempts + 1,
        message:
          body.error || 'Este ponto não pôde ser carimbado. Confira o QR code e tente novamente.',
      })
    } else {
      updateEntry(storage, scope, entry.qrToken, {
        status: 'pending',
        attempts: entry.attempts + 1,
        message: 'O serviço está indisponível. Tentaremos novamente quando a conexão voltar.',
      })
      return
    }
  }
}
