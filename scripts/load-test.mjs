#!/usr/bin/env node
/** Carga HTTP local reproduzível; nenhum token ou código de recuperação sai da memória. */
import { mkdir, writeFile } from 'node:fs/promises'
import { availableParallelism, cpus, platform, totalmem } from 'node:os'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { randomBytes } from 'node:crypto'
import { parseArgs } from 'node:util'
import { setTimeout as delay } from 'node:timers/promises'

const { values } = parseArgs({
  options: {
    'api': { type: 'string', default: 'http://localhost:3333' },
    'web': { type: 'string' },
    'users': { type: 'string', default: '300' },
    'ramp': { type: 'string', default: '25' },
    'rounds': { type: 'string', default: '3' },
    'latency-ms': { type: 'string', default: '0' },
    'timeout-ms': { type: 'string', default: '30000' },
    'p95-limit-ms': { type: 'string', default: '2000' },
    'profile': { type: 'string', default: 'development' },
    'output': { type: 'string' },
    'confirm-local-fixtures': { type: 'boolean', default: false },
    'help': { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Uso: node scripts/load-test.mjs --confirm-local-fixtures [opções]
  --api http://localhost:3333  API local (obrigatoriamente loopback)
  --web http://localhost:3000  Inclui leitura SSR autenticada; prefira build de produção
  --users 300                 Visitantes e requisições simultâneas por barreira
  --ramp 25                   Registros por etapa de preparação
  --rounds 3                  Rodadas de carimbo repetido e leitura
  --latency-ms 0              Latência adicional de ida e volta simulada no cliente
  --timeout-ms 30000          Limite de cada requisição HTTP
  --p95-limit-ms 2000         Meta de p95 para carimbo novo e repetido
  --profile development      Rótulo do ambiente no relatório
  --output arquivo.json      Relatório sem segredos
Requer API iniciada, banco LOCAL descartável migrado e seed administrativo.
Credenciais vêm de LOAD_ADMIN_EMAIL/LOAD_ADMIN_PASSWORD ou do seed de desenvolvimento.
Cria evento/apelidos Carga, revoga os tokens e exclui logicamente o evento ao terminar.
Os visitantes e históricos são preservados conforme a regra de soft delete.`)
  process.exit(0)
}

function localOrigin(value, name) {
  const url = new URL(value)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error(
      `${name} aceita somente uma origem HTTP(S) de loopback, sem caminho ou credenciais.`
    )
  return url.origin
}

function integer(value, name, min, max) {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} deve ser inteiro entre ${min} e ${max}.`)
  }
  return parsed
}

if (!values['confirm-local-fixtures'])
  throw new Error(
    'Use --confirm-local-fixtures para autorizar os dados Carga no banco local descartável.'
  )
const apiOrigin = localOrigin(values.api, '--api')
const webOrigin = values.web ? localOrigin(values.web, '--web') : null
const users = integer(values.users, '--users', 1, 1000)
const ramp = integer(values.ramp, '--ramp', 1, 1000)
const rounds = integer(values.rounds, '--rounds', 1, 20)
const latencyMs = integer(values['latency-ms'], '--latency-ms', 0, 10000)
const timeoutMs = integer(values['timeout-ms'], '--timeout-ms', 1000, 120000)
const p95LimitMs = integer(values['p95-limit-ms'], '--p95-limit-ms', 1, 120000)
const startedAt = new Date().toISOString()
const runId = `${Date.now().toString(36)}${randomBytes(2).toString('hex')}`
const output = resolve(values.output ?? `docs/validacao/carga-${runId}.json`)
const participants = []
const scenarios = []
const fixture = { name: `Carga ${runId}`, eventId: null, eventSlug: null, checkpointId: null }
const cleanup = {
  eventSoftDeleted: false,
  visitorTokensRevoked: 0,
  adminTokenRevoked: false,
  errors: 0,
}
let authorization
let event
let checkpoint
let fatalError = null
let activeRequests = 0
let maxActiveRequests = 0
let currentScenario = null

/** Os detalhes de erro são deliberadamente fechados; nunca serializamos corpo/cabeçalhos. */
class RequestFailure extends Error {
  constructor(kind, status = null) {
    super(kind)
    this.kind = kind
    this.status = status
  }
}

async function http(
  origin,
  path,
  {
    method = 'GET',
    headers = {},
    json,
    expected = 200,
    validate,
    measured = true,
    html = false,
  } = {}
) {
  const start = performance.now()
  const scenario = measured ? currentScenario : null
  if (scenario) {
    activeRequests++
    scenario.maxActive = Math.max(scenario.maxActive, activeRequests)
    maxActiveRequests = Math.max(maxActiveRequests, activeRequests)
  }
  let status = null
  let failure = null
  try {
    if (scenario && latencyMs) await delay(latencyMs / 2)
    const response = await fetch(`${origin}${path}`, {
      method,
      headers: {
        Accept: html ? 'text/html' : 'application/json',
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'error',
    })
    status = response.status
    const text = await response.text()
    if (scenario && latencyMs) await delay(latencyMs / 2)
    if (status !== expected) throw new RequestFailure('unexpected-status', status)
    let body = null
    if (text && !html) {
      try {
        body = JSON.parse(text)
      } catch {
        throw new RequestFailure('invalid-json', status)
      }
    }
    if (validate && !validate(html ? text : body))
      throw new RequestFailure('invalid-result', status)
    return body
  } catch (error) {
    failure =
      error instanceof RequestFailure
        ? error
        : new RequestFailure(error.name === 'TimeoutError' ? 'timeout' : 'network-error', status)
    throw failure
  } finally {
    if (scenario) {
      activeRequests--
      scenario.samples.push(performance.now() - start)
      scenario.statuses[String(status ?? 'network')] =
        (scenario.statuses[String(status ?? 'network')] ?? 0) + 1
      if (failure) {
        scenario.errors++
        if (scenario.errorSamples.length < 5)
          scenario.errorSamples.push({ kind: failure.kind, status: failure.status })
      }
    }
  }
}

async function api(path, options) {
  return http(apiOrigin, `/api/v1${path}`, options)
}

function visitorHeaders(person) {
  return { 'X-Visitor-Token': person.token }
}
function adminHeaders() {
  return { Authorization: authorization }
}

function percentile(sorted, p) {
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)] ?? 0
}
function rounded(value) {
  return Math.round(value * 100) / 100
}

async function scenario(name, requests, run) {
  const record = { name, samples: [], errors: 0, errorSamples: [], statuses: {}, maxActive: 0 }
  currentScenario = record
  const start = performance.now()
  let runError = null
  try {
    await run()
  } catch (error) {
    runError = error
  } finally {
    currentScenario = null
  }
  const elapsedMs = performance.now() - start
  const sorted = record.samples.sort((a, b) => a - b)
  const summary = {
    name,
    plannedRequests: requests,
    requests: sorted.length,
    errors: record.errors,
    maxConcurrent: record.maxActive,
    elapsedMs: rounded(elapsedMs),
    requestsPerSecond: rounded(sorted.length / (elapsedMs / 1000)),
    latencyMs: {
      p50: rounded(percentile(sorted, 50)),
      p95: rounded(percentile(sorted, 95)),
      p99: rounded(percentile(sorted, 99)),
      max: rounded(sorted.at(-1) ?? 0),
    },
    statuses: record.statuses,
    errorSamples: record.errorSamples,
  }
  scenarios.push(summary)
  console.log(
    `${name}: ${summary.requests} HTTP, simultâneos=${summary.maxConcurrent}, p50=${summary.latencyMs.p50}ms p95=${summary.latencyMs.p95}ms p99=${summary.latencyMs.p99}ms max=${summary.latencyMs.max}ms erros=${summary.errors}`
  )
  if (runError) throw runError
}

/** Espera todos os retornos antes de falhar, para não limpar fixtures com requisições em voo. */
async function barrier(items, run) {
  const results = await Promise.allSettled(items.map(run))
  const failed = results.find((result) => result.status === 'rejected')
  if (failed) throw failed.reason
}

try {
  const health = await http(apiOrigin, '/health', { measured: false })
  if (health?.database !== 'up') throw new RequestFailure('database-unavailable')
  const login = await api('/auth/login', {
    method: 'POST',
    measured: false,
    json: {
      email: process.env.LOAD_ADMIN_EMAIL ?? 'admin@passaporte.local',
      password: process.env.LOAD_ADMIN_PASSWORD ?? 'admin12345',
    },
    validate: (body) => Boolean(body?.data?.token),
  })
  authorization = `Bearer ${login.data.token}`
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const created = await api('/admin/events', {
    method: 'POST',
    headers: adminHeaders(),
    measured: false,
    expected: 201,
    json: {
      name: fixture.name,
      startsOn: today,
      endsOn: today,
      location: 'Carga local descartável',
      hashtag: '#CargaLocal',
      description: 'Fixture de teste de carga. Não é um evento real.',
    },
  })
  event = created.data
  fixture.eventId = event.id
  fixture.eventSlug = event.slug
  const categories = await api(`/admin/events/${event.id}/categories`, {
    headers: adminHeaders(),
    measured: false,
  })
  const point = await api(`/admin/events/${event.id}/checkpoints`, {
    method: 'POST',
    headers: adminHeaders(),
    measured: false,
    expected: 201,
    json: { name: `Carga ponto ${runId}`, categoryId: categories.data[0].id, isActive: true },
  })
  checkpoint = point.data
  fixture.checkpointId = checkpoint.id
  console.log(
    `Fixture ${fixture.name}; visitantes=${users}; API=${apiOrigin}; latência simulada=${latencyMs}ms.`
  )

  // Aquecimento explícito, excluído das métricas de carga.
  await api(`/public/events/${event.slug}`, { measured: false })
  await scenario('registro-rampa', users, async () => {
    for (let offset = 0; offset < users; offset += ramp) {
      const indexes = Array.from({ length: Math.min(ramp, users - offset) }, (_, i) => offset + i)
      await barrier(indexes, async (index) => {
        const nickname = `Carga${runId}${index.toString(36)}`.slice(0, 20)
        const result = await api('/visitor', {
          method: 'POST',
          expected: 201,
          json: { nickname },
          validate: (body) => Boolean(body?.data?.token) && body.data.nickname === nickname,
        })
        participants.push({ nickname, token: result.data.token })
      })
    }
  })
  await scenario('inscricao', users, () =>
    barrier(participants, (person) =>
      api(`/visitor/passports/${event.slug}/join`, {
        method: 'POST',
        headers: visitorHeaders(person),
        validate: (body) => body?.data?.slug === event.slug,
      })
    )
  )
  await scenario('checkin-novo', users, () =>
    barrier(participants, (person) =>
      api('/visitor/checkins', {
        method: 'POST',
        headers: visitorHeaders(person),
        json: { qrToken: checkpoint.qrToken },
        validate: (body) =>
          body?.data?.alreadyCheckedIn === false &&
          body.data.progress.visited === 1 &&
          body.data.progress.total === 1,
      })
    )
  )
  await scenario('checkin-repetido', users * rounds, async () => {
    for (let round = 0; round < rounds; round++)
      await barrier(participants, (person) =>
        api('/visitor/checkins', {
          method: 'POST',
          headers: visitorHeaders(person),
          json: { qrToken: checkpoint.qrToken },
          validate: (body) =>
            body?.data?.alreadyCheckedIn === true && body.data.progress.visited === 1,
        })
      )
  })
  await scenario('passaporte-api', users * rounds, async () => {
    for (let round = 0; round < rounds; round++)
      await barrier(participants, (person) =>
        api(`/visitor/passports/${event.slug}`, {
          headers: visitorHeaders(person),
          validate: (body) =>
            body?.data?.nickname === person.nickname &&
            body.data.progress.visited === 1 &&
            body.data.progress.total === 1,
        })
      )
  })
  if (webOrigin) {
    await http(webOrigin, `/passaporte/${event.slug}`, {
      headers: { Cookie: `pv_visitor=${participants[0].token}` },
      html: true,
      measured: false,
      validate: (html) => html.includes(participants[0].nickname),
    })
    await scenario('passaporte-web-ssr', users * rounds, async () => {
      for (let round = 0; round < rounds; round++)
        await barrier(participants, (person) =>
          http(webOrigin, `/passaporte/${event.slug}`, {
            headers: { Cookie: `pv_visitor=${person.token}` },
            html: true,
            validate: (html) =>
              html.includes(person.nickname) && !html.includes('id="__next_error__"'),
          })
        )
    })
  }
  const analytics = await api(`/admin/events/${event.id}/analytics`, {
    headers: adminHeaders(),
    measured: false,
  })
  if (
    analytics.data.summary.participants !== users ||
    analytics.data.summary.totalCheckins !== users ||
    analytics.data.summary.completedPassports !== users
  )
    throw new RequestFailure('final-metrics-mismatch')
} catch (error) {
  fatalError = {
    kind: error instanceof RequestFailure ? error.kind : 'setup-or-execution-error',
    status: error instanceof RequestFailure ? error.status : null,
  }
  console.error(
    `Falha: ${fatalError.kind}${fatalError.status ? ` (HTTP ${fatalError.status})` : ''}.`
  )
} finally {
  // A limpeza usa os mesmos endpoints públicos/administrativos; histórico de negócio não é apagado.
  for (let offset = 0; offset < participants.length; offset += ramp) {
    await Promise.all(
      participants.slice(offset, offset + ramp).map(async (person) => {
        try {
          await api('/visitor/logout', {
            method: 'POST',
            headers: visitorHeaders(person),
            measured: false,
            expected: 204,
          })
          cleanup.visitorTokensRevoked++
        } catch {
          cleanup.errors++
        }
      })
    )
  }
  if (event && authorization) {
    try {
      await api(`/admin/events/${event.id}`, {
        method: 'DELETE',
        headers: adminHeaders(),
        measured: false,
        expected: 204,
      })
      cleanup.eventSoftDeleted = true
    } catch {
      cleanup.errors++
    }
  }
  if (authorization) {
    try {
      await api('/account/logout', { method: 'POST', headers: adminHeaders(), measured: false })
      cleanup.adminTokenRevoked = true
    } catch {
      cleanup.errors++
    }
  }
}

const checkins = scenarios.filter((item) =>
  ['checkin-novo', 'checkin-repetido'].includes(item.name)
)
const criteria = {
  visitorsAtLeast300: users >= 300,
  allPlannedRequestsCompleted:
    !fatalError && scenarios.every((item) => item.requests === item.plannedRequests),
  noHttpOrValidationErrors: !fatalError && scenarios.every((item) => item.errors === 0),
  checkinsP95UnderLimit:
    checkins.length === 2 && checkins.every((item) => item.latencyMs.p95 < p95LimitMs),
  checkinsAtTargetConcurrency:
    checkins.length === 2 && checkins.every((item) => item.maxConcurrent === users),
  cleanupSucceeded:
    cleanup.errors === 0 &&
    cleanup.eventSoftDeleted &&
    cleanup.visitorTokensRevoked === participants.length &&
    cleanup.adminTokenRevoked,
}
const report = {
  version: 1,
  startedAt,
  finishedAt: new Date().toISOString(),
  profile: values.profile,
  config: {
    apiOrigin,
    webOrigin,
    users,
    ramp,
    rounds,
    simulatedRoundTripLatencyMs: latencyMs,
    timeoutMs,
    checkinP95LimitMs: p95LimitMs,
  },
  environment: {
    node: process.version,
    platform: platform(),
    cpu: cpus()[0]?.model ?? 'unknown',
    availableCpuCount: availableParallelism(),
    memoryGiB: rounded(totalmem() / 1024 ** 3),
  },
  fixture,
  maxConcurrent: maxActiveRequests,
  scenarios,
  criteria,
  passed: Object.values(criteria).every(Boolean),
  fatalError,
  cleanup,
  limitations: [
    'Medição HTTP local; latência simulada acrescenta espera no cliente e não reproduz perda de pacotes ou rede móvel real.',
    'API, banco e gerador de carga podem compartilhar máquina; repetir no hardware e rede de implantação.',
    'Cada barreira dispara uma requisição por visitante. Não simula duração completa do evento ou leitura de câmera.',
    'Leitura web, quando solicitada, mede HTML SSR autenticado; não mede pintura, JavaScript ou interação no navegador.',
    'Visitantes e históricos Carga são preservados; evento é excluído logicamente e tokens de sessão são revogados.',
  ],
}
await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(`Relatório: ${output}`)
console.log(`Resultado da meta: ${report.passed ? 'PASSOU' : 'NÃO PASSOU'}.`)
if (!report.passed) process.exitCode = 1
