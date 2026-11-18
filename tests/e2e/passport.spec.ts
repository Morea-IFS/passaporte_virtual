import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const API = process.env.E2E_API_URL ?? 'http://localhost:3333'

async function fixture(request: APIRequestContext) {
  const login = await request.post(`${API}/api/v1/auth/login`, {
    data: { email: 'admin@passaporte.local', password: 'admin12345' },
  })
  expect(login.ok()).toBeTruthy()
  const headers = { Authorization: `Bearer ${(await login.json()).data.token}` }
  const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const created = await request.post(`${API}/api/v1/admin/events`, {
    headers,
    data: {
      name: `QA celular ${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      startsOn: date,
      endsOn: date,
      hashtag: 'CienciaDelas',
      evaluationMode: 'integrated',
    },
  })
  expect(created.ok()).toBeTruthy()
  const event = (await created.json()).data
  const categories = (
    await (
      await request.get(`${API}/api/v1/admin/events/${event.id}/categories`, { headers })
    ).json()
  ).data
  const response = await request.post(`${API}/api/v1/admin/events/${event.id}/checkpoints`, {
    headers,
    data: {
      name: 'Oficina de robótica',
      categoryId: categories[0].id,
      isActive: true,
      summary: 'Uma experiência de ciência e tecnologia.',
    },
  })
  expect(response.ok()).toBeTruthy()
  const checkpoint = (await response.json()).data
  return { event, checkpoint, headers }
}

async function accessible(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {}))
    )
  })
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))
  ).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
}

test('visitante cria, carimba, compartilha, avalia e organização consulta indicadores', async ({
  page,
  context,
  request,
  baseURL,
}, testInfo) => {
  const { event, checkpoint, headers } = await fixture(request)
  const nickname = `qa${Date.now().toString(36)}${testInfo.project.name.slice(0, 2)}`
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`/passaporte/${event.slug}`)
  const installDialog = page.getByRole('dialog', { name: 'Instalar o Passaporte' })
  await installDialog.getByRole('button', { name: /^(Entendi|Agora não)$/ }).click()
  await page.getByLabel('Apelido', { exact: true }).fill(nickname)
  await page.getByRole('button', { name: 'Criar meu passaporte' }).click()
  await expect(page.getByText('Passaporte criado!', { exact: true })).toBeVisible()
  const cookie = (await context.cookies()).find((item) => item.name === 'pv_visitor')!
  expect(cookie.httpOnly).toBeTruthy()
  if (baseURL?.startsWith('https:')) expect(cookie.secure).toBeTruthy()
  const before = await request.get(`${API}/api/v1/admin/events/${event.id}/analytics`, { headers })
  expect((await before.json()).data.summary).toMatchObject({ participants: 1, totalCheckins: 0 })
  await page.goto(`/c/${checkpoint.qrToken}`)
  await expect(page.getByText('Carimbado!', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Compartilhar conquista' }).click()
  await expect(page.getByRole('dialog', { name: 'Seu card para Stories' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Baixar/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto(`/passaporte/${event.slug}`)
  const rating = '5 estrelas: Excelente'
  await page.getByTitle(rating, { exact: true }).click()
  await expect(page.getByRole('radio', { name: rating, exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Enviar avaliação' }).click()
  await expect(page.getByText('Avaliação salva. Obrigado por participar!')).toBeVisible()
  await accessible(page)
  await page.emulateMedia({ colorScheme: 'dark' })
  await accessible(page)
  await page.getByRole('link', { name: 'Ranking de participantes' }).click()
  await expect(page).toHaveURL(/\/ranking$/)
  await expect(
    page
      .getByRole('list', { name: 'Classificação por pontos visitados' })
      .getByText(nickname, { exact: true })
  ).toBeVisible()
  await accessible(page)
  await page.goto('/admin/login')
  await page.getByLabel('E-mail', { exact: true }).fill('admin@passaporte.local')
  await page.getByLabel('Senha', { exact: true }).fill('admin12345')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await page.goto(`/admin/eventos/${event.id}/dados`)
  await expect(page.getByRole('heading', { name: 'Dados do evento' })).toBeVisible()
  await accessible(page)
  const csvResponse = await page.request.get(`/admin/eventos/${event.id}/dados/csv`)
  expect(csvResponse.ok()).toBeTruthy()
  expect(csvResponse.headers()['content-disposition']).toContain('attachment;')
  expect(await csvResponse.text()).toContain('Passaportes criados')
  const download = testInfo.project.name === 'android' ? page.waitForEvent('download') : null
  await page.getByRole('link', { name: 'Exportar indicadores (CSV)' }).click()
  if (download) expect((await download).suggestedFilename()).toMatch(/\.csv$/)
  await page.goto(`/admin/eventos/${event.id}/avaliacoes`)
  await expect(page.getByText('1 resposta · Média: 5 de 5')).toBeVisible()
  await accessible(page)
  await page.goto(`/admin/eventos/${event.id}/editar`)
  await page.getByText('Formulário externo', { exact: true }).click()
  await page.getByLabel('Link da avaliação').fill('https://example.com/avaliar')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page).toHaveURL(new RegExp(`/admin/eventos/${event.id}$`))
  await page.goto(`/passaporte/${event.slug}`)
  await expect(page.getByRole('link', { name: /^Avaliar o evento/ })).toHaveAttribute(
    'href',
    'https://example.com/avaliar'
  )
  expect(errors).toEqual([])
  await request.delete(`${API}/api/v1/admin/events/${event.id}`, { headers })
  await request.post(`${API}/api/v1/account/logout`, { headers })
})
