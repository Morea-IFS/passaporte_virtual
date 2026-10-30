import Event from '#models/event'
import User from '#models/user'
import Visitor from '#models/visitor'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

async function createEvent() {
  const suffix = randomUUID()
  return Event.create({
    name: `Evento de resiliência ${suffix}`,
    slug: `resiliencia-${suffix}`,
    startsOn: DateTime.now(),
    endsOn: DateTime.now(),
    evaluationMode: 'integrated',
  })
}

test.group('Resiliência do cadastro e das avaliações', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('evento inválido não reserva apelido e cadastro válido inscreve sem criar carimbo', async ({
    client,
    assert,
    db,
  }) => {
    const event = await createEvent()
    const nickname = `novo-${randomUUID().slice(0, 8)}`
    const rejected = await client
      .post('/api/v1/visitor')
      .json({ nickname, eventSlug: `inexistente-${randomUUID()}` })
    rejected.assertStatus(404)
    await db.assertMissing('visitors', { nickname })

    // Reusar o mesmo apelido precisa funcionar depois da falha, sem conta órfã.
    const registration = await client
      .post('/api/v1/visitor')
      .json({ nickname, eventSlug: event.slug })
    registration.assertStatus(201)
    const account = registration.body().data
    assert.equal(account.nickname, nickname)
    assert.match(account.recoveryCode, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    const visitor = await Visitor.query().where('nickname', nickname).firstOrFail()
    await db.assertHas(
      'event_participations',
      { visitor_id: visitor.id, event_id: event.id, deleted_at: null },
      1
    )
    await db.assertMissing('checkins', { visitor_id: visitor.id, event_id: event.id })
    const passports = await client
      .get('/api/v1/visitor/passports')
      .header('X-Visitor-Token', account.token)
    passports.assertStatus(200)
    passports.assertBodyContains({
      data: { nickname, passports: [{ slug: event.slug, visited: 0 }] },
    })
  })

  test('nota de visitante excluído sai do agregado e evento excluído rejeita novas avaliações', async ({
    client,
    assert,
    db,
  }) => {
    const event = await createEvent()
    const path = `/api/v1/visitor/events/${event.slug}/evaluation`
    const accounts = []
    for (const prefix of ['vivo', 'removido']) {
      const nickname = `${prefix}-${randomUUID().slice(0, 8)}`
      const registration = await client
        .post('/api/v1/visitor')
        .json({ nickname, eventSlug: event.slug })
      registration.assertStatus(201)
      accounts.push(registration.body().data)
    }
    for (const [index, account] of accounts.entries()) {
      const rating = await client
        .post(path)
        .header('X-Visitor-Token', account.token)
        .json({ rating: index === 0 ? 5 : 1 })
      rating.assertStatus(200)
    }
    const administrator = await User.create({
      email: `resiliencia-${randomUUID()}@example.com`,
      password: 'senha-segura',
      isActive: true,
    })
    const adminToken = await User.accessTokens.create(administrator)
    const authorization = `Bearer ${adminToken.value!.release()}`
    const summaryPath = `/api/v1/admin/events/${event.id}/evaluations`
    const before = await client.get(summaryPath).header('Authorization', authorization)
    before.assertStatus(200)
    before.assertBodyContains({ data: { total: 2, average: 3 } })

    const removed = await Visitor.query().where('nickname', accounts[1].nickname).firstOrFail()
    await removed.softDelete()
    const after = await client.get(summaryPath).header('Authorization', authorization)
    after.assertStatus(200)
    assert.deepEqual((after.body() as { data: unknown }).data, {
      total: 1,
      average: 5,
      distribution: [
        { rating: 1, total: 0 },
        { rating: 2, total: 0 },
        { rating: 3, total: 0 },
        { rating: 4, total: 0 },
        { rating: 5, total: 1 },
      ],
    })
    for (const account of accounts)
      assert.notInclude(JSON.stringify(after.body()), account.nickname)

    await event.softDelete()
    const rejected = await client
      .post(path)
      .header('X-Visitor-Token', accounts[0].token)
      .json({ rating: 4 })
    rejected.assertStatus(404)
    const deletedSummary = await client.get(summaryPath).header('Authorization', authorization)
    deletedSummary.assertStatus(404)
    await db.assertMissing('event_evaluations', { event_id: event.id, deleted_at: null })
  })
})
