import Event from '#models/event'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

test.group('Avaliação configurável do evento', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function setup(mode = 'integrated') {
    const suffix = randomUUID().slice(0, 8)
    const event = await Event.create({
      name: `Evento ${suffix}`,
      slug: `evento-${suffix}`,
      startsOn: DateTime.now(),
      endsOn: DateTime.now(),
      evaluationMode: mode,
      evaluationUrl: mode === 'external' ? 'https://example.com/formulario' : null,
    })
    return { event, nickname: `nota-${suffix}` }
  }

  test('exige sessão, aceita nota1–5 e atualiza uma única resposta por evento', async ({
    client,
    assert,
    db,
  }) => {
    const { event, nickname } = await setup()
    const registration = await client.post('/api/v1/visitor').json({ nickname })
    const token = registration.body().data.token
    const path = `/api/v1/visitor/events/${event.slug}/evaluation`
    const response1 = await client.post(path).json({ rating: 5 })
    response1.assertStatus(401)
    for (const rating of [0, 6, 2.5, 'abc']) {
      const response2 = await client.post(path).header('X-Visitor-Token', token).json({ rating })
      response2.assertStatus(422)
    }
    const response3 = await client.post(path).header('X-Visitor-Token', token).json({ rating: 2 })
    response3.assertStatus(200)
    const response4 = await client.post(path).header('X-Visitor-Token', token).json({ rating: 5 })
    response4.assertStatus(200)
    await db.assertHas('event_evaluations', { event_id: event.id, rating: 5 }, 1)
    const own = await client.get(path).header('X-Visitor-Token', token)
    own.assertBodyContains({ data: { rating: 5 } })
    const admin = await User.create({
      email: `admin-${randomUUID()}@example.com`,
      password: 'senha-segura',
      isActive: true,
    })
    const adminToken = await User.accessTokens.create(admin)
    const summary = await client
      .get(`/api/v1/admin/events/${event.id}/evaluations`)
      .header('Authorization', `Bearer ${adminToken.value!.release()}`)
    summary.assertStatus(200)
    summary.assertBodyContains({
      data: { total: 1, average: 5, distribution: [{ rating: 5, total: 1 }] },
    })
    assert.notInclude(JSON.stringify(summary.body()), nickname)
  })

  test('formulário externo não recebe notas e resultados exigem administrador', async ({
    client,
  }) => {
    const { event, nickname } = await setup('external')
    const registration = await client.post('/api/v1/visitor').json({ nickname })
    const response5 = await client
      .post(`/api/v1/visitor/events/${event.slug}/evaluation`)
      .header('X-Visitor-Token', registration.body().data.token)
      .json({ rating: 4 })
    response5.assertStatus(422)
    const response6 = await client.get(`/api/v1/admin/events/${event.id}/evaluations`)
    response6.assertStatus(401)
    const publicPassport = await client.get(`/api/v1/public/events/${event.slug}`)
    publicPassport.assertBodyContains({
      data: {
        event: { evaluationMode: 'external', evaluationUrl: 'https://example.com/formulario' },
      },
    })
  })

  test('configuração externa exige link HTTP válido e evento excluído rejeita avaliação', async ({
    client,
  }) => {
    const { event, nickname } = await setup()
    const admin = await User.create({
      email: `admin-${randomUUID()}@example.com`,
      password: 'senha-segura',
      isActive: true,
    })
    const token = await User.accessTokens.create(admin)
    const payload = {
      name: event.name,
      startsOn: event.startsOn.toISODate(),
      endsOn: event.endsOn.toISODate(),
      evaluationMode: 'external',
    }
    for (const evaluationUrl of [null, 'javascript:alert(1)', 'ftp://example.com/form']) {
      const response7 = await client
        .put(`/api/v1/admin/events/${event.id}`)
        .header('Authorization', `Bearer ${token.value!.release()}`)
        .json({ ...payload, evaluationUrl })
      response7.assertStatus(422)
    }
    const registration = await client.post('/api/v1/visitor').json({ nickname })
    await event.softDelete()
    const response8 = await client
      .post(`/api/v1/visitor/events/${event.slug}/evaluation`)
      .header('X-Visitor-Token', registration.body().data.token)
      .json({ rating: 4 })
    response8.assertStatus(404)
  })
})
