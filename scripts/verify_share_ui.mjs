/**
 * Smoke local do RF22–25 com o visitante de demonstração já carimbado.
 * Requer API/web de QA e Playwright (ou PLAYWRIGHT_MODULE apontando para o módulo instalado).
 * Exemplo: PLAYWRIGHT_MODULE=/caminho/playwright/index.mjs node scripts/verify_share_ui.mjs
 * Recupera uma sessão temporária e a encerra ao terminar. Não cria novos carimbos.
 */
import assert from 'node:assert/strict'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const api = `${process.env.QA_API_URL || 'http://localhost:3333'}/api/v1`
const web = process.env.QA_WEB_URL || 'http://localhost:3000'
const recovered = await fetch(`${api}/visitor/recover`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nickname: process.env.QA_VISITOR || 'teste',
    code: process.env.QA_RECOVERY_CODE || 'TEST-2345',
  }),
})
assert.equal(recovered.status, 200, 'O visitante de QA precisa existir.')
const account = (await recovered.json()).data
let browser
try {
  const response = await fetch(
    `${api}/visitor/passports/${process.env.QA_EVENT_SLUG || '23a-snct-ciencia-delas'}`,
    { headers: { 'X-Visitor-Token': account.token } }
  )
  assert.equal(response.status, 200)
  const passport = (await response.json()).data
  const checkpoint = passport.checkpoints.find((point) => point.visitedAt && point.isActive)
  assert.ok(checkpoint, 'QA precisa de um carimbo já existente.')
  browser = await chromium.launch({
    ...(process.env.CHROME_BIN
      ? { executablePath: process.env.CHROME_BIN }
      : { channel: 'chrome' }),
    headless: true,
    args: ['--no-sandbox'],
  })
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  })
  await context.addCookies([
    { name: 'pv_visitor', value: account.token, url: web, httpOnly: true, sameSite: 'Lax' },
  ])
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${web}/c/${checkpoint.qrToken}`)
  const open = page.getByRole('button', { name: 'Compartilhar conquista', exact: true })
  await open.waitFor({ timeout: 30000 })
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Seu card para Stories' })
  await dialog.getByRole('img').waitFor()
  const metrics = await page.evaluate(async () => {
    const modal = document.querySelector('dialog[open]')
    const image = modal.querySelector('img')
    const blob = await (await fetch(image.src)).blob()
    const bitmap = await createImageBitmap(blob)
    return {
      width: bitmap.width,
      height: bitmap.height,
      type: blob.type,
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      dialogOverflow: modal.scrollWidth > modal.clientWidth,
    }
  })
  assert.deepEqual(metrics, {
    width: 1080,
    height: 1920,
    type: 'image/png',
    pageOverflow: false,
    dialogOverflow: false,
  })
  // Simula um navegador sem envio nativo de arquivos, independentemente do SO do runner.
  await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { value: () => false }))
  await dialog.getByRole('button', { name: 'Compartilhar no celular', exact: true }).click()
  await dialog
    .getByRole('status')
    .filter({ hasText: 'Este navegador não oferece compartilhamento de imagens.' })
    .waitFor()
  const downloadPromise = page.waitForEvent('download')
  await dialog.getByRole('link', { name: 'Baixar card (PNG)', exact: true }).click()
  const download = await downloadPromise
  await download.saveAs(process.env.QA_STORY_DOWNLOAD || '/tmp/passaporte-shared-download.png')
  assert.match(download.suggestedFilename(), /^passaporte-[a-z0-9-]+\.png$/)
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 200
    const context = canvas.getContext('2d')
    context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      '--color-magenta'
    )
    context.fillRect(0, 0, 100, 200)
    return canvas.toDataURL().split(',')[1]
  })
  const uploads = []
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method())) {
      uploads.push(`${request.method()} ${new URL(request.url()).pathname}`)
    }
  })
  await dialog.getByLabel('Adicionar foto da galeria').setInputFiles({
    name: 'foto-qa.png',
    mimeType: 'image/png',
    buffer: Buffer.from(photo, 'base64'),
  })
  await dialog.getByRole('button', { name: 'Remover foto', exact: true }).waitFor()
  await dialog.getByRole('img').waitFor()
  const pixel = await page.evaluate(async () => {
    const bitmap = await createImageBitmap(
      await (await fetch(document.querySelector('dialog img').src)).blob()
    )
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const context = canvas.getContext('2d')
    context.drawImage(bitmap, 0, 0)
    return [...context.getImageData(540, 700, 1, 1).data]
  })
  assert.deepEqual(pixel, [217, 50, 126, 255])
  assert.deepEqual(uploads, [])
  await page.screenshot({
    path: process.env.QA_SHARE_SCREENSHOT || '/tmp/passaporte-share-mobile.png',
  })
  await dialog.getByRole('button', { name: 'Fechar', exact: true }).click()
  await open.click()
  await dialog.getByRole('img').waitFor()
  assert.equal(await dialog.getByRole('button', { name: 'Remover foto', exact: true }).count(), 0)
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      ui: 'OK',
      viewport: '393x852',
      ...metrics,
      nativeFallback: 'OK',
      download: 'OK',
      localPhoto: 'OK',
      photoDiscarded: 'OK',
      uploadRequests: uploads.length,
      consoleErrors: errors.length,
    })
  )
} finally {
  await browser?.close()
  await fetch(`${api}/visitor/logout`, {
    method: 'POST',
    headers: { 'X-Visitor-Token': account.token },
  })
}
