import { expect, test, type APIRequestContext } from '@playwright/test'

const API = process.env.E2E_API_URL ?? 'http://localhost:3333'
const STORAGE = 'pv-offline-v1'

async function checkpointFixture(request: APIRequestContext) {
  const eventsResponse = await request.get(`${API}/api/v1/public/events`)
  expect(eventsResponse.ok()).toBeTruthy()
  const { data: events } = await eventsResponse.json()
  const event = events.find((candidate: { ended: boolean }) => !candidate.ended)
  expect(event, 'An open seeded event is required').toBeTruthy()
  const passportResponse = await request.get(`${API}/api/v1/public/events/${event.slug}`)
  const { data: passport } = await passportResponse.json()
  const checkpoint = passport.checkpoints.find(
    (candidate: { isActive: boolean }) => candidate.isActive
  )
  expect(checkpoint, 'An active seeded checkpoint is required').toBeTruthy()
  return { event, checkpoint }
}

test('an unseen QR is queued offline and confirmed once after reconnection', async ({
  page,
  context,
  request,
  baseURL,
}, testInfo) => {
  const { event, checkpoint } = await checkpointFixture(request)
  const nickname = `off${Date.now().toString(36)}${testInfo.workerIndex}${Math.random().toString(36).slice(2, 4)}`
  const registration = await request.post(`${API}/api/v1/visitor`, { data: { nickname } })
  expect(registration.ok()).toBeTruthy()
  const { data: account } = await registration.json()
  await context.addCookies([
    { name: 'pv_visitor', value: account.token, url: baseURL!, httpOnly: true, sameSite: 'Lax' },
  ])
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(`/passaporte/${event.slug}`)
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}').scope, STORAGE)
    )
    .toMatch(/^[a-f0-9]{64}$/)
  await page.evaluate(() => navigator.serviceWorker.ready)
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) await page.reload()
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBeTruthy()

  await context.setOffline(true)
  await page.goto(`/c/${checkpoint.qrToken}`)
  await expect(page.locator('#message')).toContainText('QR guardado como visita pendente')
  const pending = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || '{}'),
    STORAGE
  )
  expect(pending.entries).toHaveLength(1)
  expect(pending.entries[0]).toMatchObject({ qrToken: checkpoint.qrToken, status: 'pending' })
  expect(JSON.stringify(pending)).not.toContain(account.token)
  expect(JSON.stringify(pending)).not.toContain(account.recoveryCode)
  expect(JSON.stringify(pending)).not.toContain(nickname)
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 375)

  await context.setOffline(false)
  await expect
    .poll(
      () =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key) || '{}').entries?.[0]?.status,
          STORAGE
        ),
      { timeout: 30000 }
    )
    .toBe('synced')
  await expect(page.locator('#queue')).toContainText('carimbo confirmado')
  const replay = await request.post(`${API}/api/v1/visitor/checkins`, {
    headers: { 'X-Visitor-Token': account.token },
    data: { qrToken: checkpoint.qrToken },
  })
  expect(replay.ok()).toBeTruthy()
  const { data: replayed } = await replay.json()
  expect(replayed.alreadyCheckedIn).toBe(true)
  expect(replayed.progress.visited).toBe(1)

  const cachedURLs = await page.evaluate(async () => {
    const urls = []
    for (const name of await caches.keys())
      for (const request of await (await caches.open(name)).keys())
        urls.push(new URL(request.url).pathname)
    return urls
  })
  expect(cachedURLs).toContain('/offline.html')
  expect(cachedURLs.some((url) => /^\/(api|admin|passaporte|recuperar|c)(\/|$)/.test(url))).toBe(
    false
  )
})

test('offline shell explains that an unidentified device needs its first connection', async ({
  page,
  context,
  request,
}) => {
  const { checkpoint } = await checkpointFixture(request)
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) await page.reload()
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBeTruthy()
  await context.setOffline(true)
  await page.goto(`/c/${checkpoint.qrToken}`)
  await expect(page.locator('#message')).toContainText('criar ou recuperar seu passaporte')
  await expect(page.locator('#message')).toContainText('Este QR não foi registrado')
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE)).toBeNull()
})

test('queued visits cannot cross device sessions or request origins', async ({
  page,
  context,
  request,
  baseURL,
}, testInfo) => {
  const { event, checkpoint } = await checkpointFixture(request)
  async function account(suffix: string) {
    const nickname = `iso${Date.now().toString(36)}${testInfo.workerIndex}${suffix}`
    const registration = await request.post(`${API}/api/v1/visitor`, { data: { nickname } })
    expect(registration.ok()).toBeTruthy()
    return (await registration.json()).data
  }
  const first = await account('a')
  const second = await account('b')
  const cookie = (token: string) => ({
    name: 'pv_visitor',
    value: token,
    url: baseURL!,
    httpOnly: true,
    sameSite: 'Lax' as const,
  })
  await context.addCookies([cookie(first.token)])
  await page.goto(`/passaporte/${event.slug}`)
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}').scope, STORAGE)
    )
    .toMatch(/^[a-f0-9]{64}$/)
  const scope = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).scope, STORAGE)
  const foreignOrigin = await context.request.post('/api/offline/checkins', {
    headers: { Origin: 'https://other.example' },
    data: { qrToken: checkpoint.qrToken, scope },
  })
  expect(foreignOrigin.status()).toBe(403)
  await context.addCookies([cookie(second.token)])
  const switchedSession = await context.request.post('/api/offline/checkins', {
    headers: { Origin: baseURL! },
    data: { qrToken: checkpoint.qrToken, scope },
  })
  expect(switchedSession.status()).toBe(409)
  const passportResponse = await request.get(`${API}/api/v1/visitor/passports/${event.slug}`, {
    headers: { 'X-Visitor-Token': second.token },
  })
  expect(passportResponse.ok()).toBeTruthy()
  expect((await passportResponse.json()).data.progress.visited).toBe(0)
})
