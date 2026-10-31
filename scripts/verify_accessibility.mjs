/**
 * Auditoria automática local RNF01/RNF08 em 360px, nos dois temas.
 * Usa o seed QA e sessões temporárias; abre telas sem alterar cadastros.
 * Requer @axe-core/playwright, @playwright/test e Chrome.
 * node scripts/verify_accessibility.mjs
 */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'

const web = process.env.QA_WEB_URL || 'http://localhost:3000'
const api = `${process.env.QA_API_URL || 'http://localhost:3333'}/api/v1`
const output = process.env.QA_A11Y_OUTPUT || '/tmp/passaporte-accessibility'
await mkdir(output, { recursive: true })
const get = async (url, options) => {
  const response = await fetch(url, options)
  assert.ok(response.ok, `${new URL(url).pathname}: HTTP ${response.status}`)
  return response.json()
}
const post = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
const administrator = (
  await get(
    `${api}/auth/login`,
    post({
      email: process.env.QA_ADMIN_EMAIL || 'admin@passaporte.local',
      password: process.env.QA_ADMIN_PASSWORD || 'admin12345',
    })
  )
).data
const visitor = (
  await get(
    `${api}/visitor/recover`,
    post({
      nickname: process.env.QA_VISITOR || 'teste',
      code: process.env.QA_RECOVERY_CODE || 'TEST-2345',
    })
  )
).data
const adminHeaders = { Authorization: `Bearer ${administrator.token}` }
const events = (await get(`${api}/admin/events`, { headers: adminHeaders })).data
const event = events.find(
  (row) => row.slug === (process.env.QA_EVENT_SLUG || '23a-snct-ciencia-delas')
)
assert.ok(event)
const passport = (
  await get(`${api}/visitor/passports/${event.slug}`, {
    headers: { 'X-Visitor-Token': visitor.token },
  })
).data
const point = passport.checkpoints.find((row) => row.visitedAt && row.isActive)
assert.ok(point)
const plans = [
  {
    role: 'public',
    paths: [
      '/?escolher=1',
      '/recuperar',
      '/privacidade',
      `/passaporte/${event.slug}`,
      '/admin/login',
    ],
  },
  {
    role: 'visitor',
    paths: [
      `/passaporte/${event.slug}`,
      `/passaporte/${event.slug}/ranking`,
      `/c/${point.qrToken}`,
    ],
  },
  {
    role: 'admin',
    paths: [
      '/admin',
      '/admin/eventos/novo',
      `/admin/eventos/${event.id}`,
      `/admin/eventos/${event.id}/dados`,
      `/admin/eventos/${event.id}/avaliacoes`,
      `/admin/eventos/${event.id}/categorias`,
      `/admin/eventos/${event.id}/qrcodes`,
      `/admin/eventos/${event.id}/editar`,
      `/admin/eventos/${event.id}/importar`,
      '/admin/participantes',
      '/admin/administradores',
      '/admin/auditoria',
    ],
  },
]
const browser = await chromium.launch({
  ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : { channel: 'chrome' }),
  headless: true,
  args: ['--no-sandbox'],
})
const report = {
  viewport: { width: 360, height: 800 },
  minimumTarget: 44,
  axeTags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  pages: [],
}
try {
  for (const theme of ['light', 'dark']) {
    for (const plan of plans) {
      const context = await browser.newContext({
        viewport: report.viewport,
        isMobile: true,
        hasTouch: true,
        colorScheme: theme,
      })
      await context.addInitScript((theme) => localStorage.setItem('pv-theme', theme), theme)
      if (plan.role !== 'public') {
        await context.addCookies([
          {
            name: plan.role === 'admin' ? 'pv_admin_token' : 'pv_visitor',
            value: plan.role === 'admin' ? administrator.token : visitor.token,
            url: web,
            httpOnly: true,
            sameSite: 'Lax',
          },
        ])
      }
      const page = await context.newPage()
      for (const path of plan.paths) {
        await page.goto(web + path, { waitUntil: 'load' })
        await page.locator('main:visible').last().waitFor()
        await page.evaluate(() => document.fonts.ready)
        await page.waitForFunction(
          () =>
            ![...document.querySelectorAll('[aria-busy="true"]')].some(
              (element) => element.getClientRects().length > 0
            )
        )
        if (path.startsWith('/c/'))
          await page.getByRole('button', { name: 'Compartilhar conquista', exact: true }).waitFor()
        const audit = async (label = path) => {
          const result = await new AxeBuilder({ page })
            .exclude('nextjs-portal')
            .withTags(report.axeTags)
            .analyze()
          const layout = await page.evaluate(() => {
            const targets = []
            for (const element of document.querySelectorAll(
              'a[href],button,input:not([type="hidden"]),select,textarea,summary,[role="button"]'
            )) {
              if (
                element.closest('nextjs-portal') ||
                element.disabled ||
                element.closest('[inert]')
              )
                continue
              const actual =
                element instanceof HTMLInputElement &&
                ['checkbox', 'radio', 'file'].includes(element.type) &&
                element.labels?.length
                  ? element.labels[0]
                  : element
              const style = getComputedStyle(actual)
              const box = actual.getBoundingClientRect()
              if (
                box.width === 0 ||
                box.height === 0 ||
                style.visibility === 'hidden' ||
                style.clipPath.includes('50%')
              )
                continue
              if (box.width < 43.9 || box.height < 43.9)
                targets.push({
                  tag: element.tagName,
                  label:
                    element.getAttribute('aria-label') || actual.textContent?.trim().slice(0, 90),
                  width: Math.round(box.width * 10) / 10,
                  height: Math.round(box.height * 10) / 10,
                  html: element.outerHTML.slice(0, 250),
                })
            }
            return {
              horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
              targets,
            }
          })
          report.pages.push({
            role: plan.role,
            path: label,
            theme,
            ...layout,
            violations: result.violations.map(({ id, impact, description, nodes }) => ({
              id,
              impact,
              description,
              nodes: nodes.map(({ html, target, failureSummary }) => ({
                html,
                target,
                failureSummary,
              })),
            })),
            incomplete: result.incomplete.map(({ id, description, nodes }) => ({
              id,
              description,
              nodes: nodes.map(({ html, target, failureSummary, any, all, none }) => ({
                html,
                target,
                failureSummary,
                checks: [...any, ...all, ...none].map(({ id, message, data }) => ({
                  id,
                  message,
                  data,
                })),
              })),
            })),
          })
          console.log(
            `${theme} ${plan.role} ${label}: axe=${result.violations.length}, toque=${layout.targets.length}, overflow=${layout.horizontalOverflow}`
          )
        }
        await audit()
        if (path.startsWith('/c/')) {
          await page.getByRole('button', { name: 'Compartilhar conquista', exact: true }).click()
          await page.getByRole('dialog').getByRole('img').waitFor()
          await audit(`${path}#card`)
        }
        if (path.endsWith('/editar')) {
          await page.locator('#field-startsOn').click()
          await page.getByRole('dialog', { name: 'Início', exact: true }).waitFor()
          await audit(`${path}#calendario`)
        }
        if (path === '/admin/administradores') {
          await page.getByRole('button', { name: /^Situação:/ }).click()
          await page.getByRole('dialog', { name: 'Situação', exact: true }).waitFor()
          await audit(`${path}#seletor`)
        }
      }
      await context.close()
    }
  }
} finally {
  await browser.close()
  await fetch(`${api}/account/logout`, { method: 'POST', headers: adminHeaders })
  await fetch(`${api}/visitor/logout`, {
    method: 'POST',
    headers: { 'X-Visitor-Token': visitor.token },
  })
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n')
}
const failed = report.pages.filter(
  (page) => page.violations.length || page.targets.length || page.horizontalOverflow
)
console.log(
  `Relatório ${output}/report.json: ${report.pages.length} telas/temas, ${failed.length} com falhas automáticas. Resultados inconclusivos do axe estão preservados para revisão manual.`
)
if (failed.length) process.exitCode = 1
