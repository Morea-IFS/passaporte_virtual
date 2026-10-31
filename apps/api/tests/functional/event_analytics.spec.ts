import AuditLog from '#models/audit_log'
import Checkin from '#models/checkin'
import Checkpoint from '#models/checkpoint'
import CheckpointCategory from '#models/checkpoint_category'
import Event from '#models/event'
import EventParticipation from '#models/event_participation'
import User from '#models/user'
import Visitor from '#models/visitor'
import VisitorToken from '#models/visitor_token'
import { csvCell } from '#services/event_analytics'
import testUtils from '@adonisjs/core/services/test_utils'
import database from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

async function createEvent(name = 'Evento de indicadores') {
  const event = await Event.create({
    name,
    slug: `indicadores-${randomUUID()}`,
    startsOn: DateTime.fromISO('2026-10-23'),
    endsOn: DateTime.fromISO('2026-10-24'),
  })
  const research = await CheckpointCategory.create({
    eventId: event.id,
    name: 'Pesquisa',
    color: 'azul',
    position: 0,
  })
  const workshop = await CheckpointCategory.create({
    eventId: event.id,
    name: 'Oficina',
    color: 'laranja',
    position: 1,
  })
  const cp = async (code: string, categoryId = research.id, isActive = true) =>
    Checkpoint.create({ eventId: event.id, categoryId, code, name: `Ponto ${code}`, isActive })
  return { event, research, workshop, cp }
}

async function visitor(prefix = 'pessoa') {
  const person = new Visitor()
  person.nickname = `${prefix}-${randomUUID().slice(0, 8)}`
  person.recoveryCode = 'ABCD-EFGH'
  await person.save()
  return person
}

async function admin() {
  const person = await User.create({
    fullName: 'Admin Indicadores',
    email: `${randomUUID()}@example.com`,
    password: 'senha-segura',
    isActive: true,
  })
  const token = await User.accessTokens.create(person)
  return { person, authorization: `Bearer ${token.value!.release()}` }
}

test.group('Indicadores, inscrições e ranking', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('registra passaporte sem carimbos apenas em POST e inclui participante no filtro administrativo', async ({
    client,
    assert,
    db,
  }) => {
    const { event } = await createEvent()
    const person = await visitor()
    const token = await VisitorToken.issue(person)
    const { authorization } = await admin()
    const base = `/api/v1/visitor/passports/${event.slug}`
    const statusResponse1 = await client.get(base).header('X-Visitor-Token', token)
    statusResponse1.assertStatus(200)
    await db.assertMissing('event_participations', { visitor_id: person.id, event_id: event.id })
    const statusResponse2 = await client.post(`${base}/join`)
    statusResponse2.assertStatus(401)
    for (let attempt = 0; attempt < 2; attempt++) {
      const statusResponse3 = await client.post(`${base}/join`).header('X-Visitor-Token', token)
      statusResponse3.assertStatus(200)
    }
    await db.assertHas('event_participations', { visitor_id: person.id, event_id: event.id }, 1)
    const passports = await client.get('/api/v1/visitor/passports').header('X-Visitor-Token', token)
    passports.assertBodyContains({ data: { passports: [{ slug: event.slug, visited: 0 }] } })
    const participants = await client
      .get(`/api/v1/admin/participants?eventId=${event.id}`)
      .header('Authorization', authorization)
    participants.assertStatus(200)
    participants.assertBodyContains({
      data: [{ nickname: person.nickname, events: [{ id: event.id, visited: 0, total: 0 }] }],
    })
    assert.equal(participants.body().metadata.total, 1)
    const report = await client
      .get(`/api/v1/admin/events/${event.id}/analytics`)
      .header('Authorization', authorization)
    report.assertBodyContains({
      data: {
        summary: { participants: 1, totalCheckins: 0, completedPassports: 0, averageVisited: 0 },
      },
    })
  })

  test('agrega métricas, pontos sem visitas, fuso de Brasília, empates e exclusões sem misturar eventos', async ({
    client,
    assert,
  }) => {
    const { event, research, workshop, cp } = await createEvent()
    const a = await cp('CP-001')
    const b = await cp('CP-002', workshop.id)
    const zero = await cp('CP-003', workshop.id, false)
    const inactive = await cp('CP-004', research.id, false)
    const deleted = await cp('CP-005')
    const complete = await visitor('ana')
    const partial = await visitor('bia')
    const waiting = await visitor('caio')
    const removed = await visitor('removido')
    const excludedEnrollment = await visitor('excluido')
    for (const person of [complete, partial, waiting, removed, excludedEnrollment]) {
      await EventParticipation.create({ eventId: event.id, visitorId: person.id })
    }
    const stamp = (
      person: Visitor,
      checkpoint: Checkpoint,
      time: string,
      deletedAt: DateTime | null = null
    ) =>
      Checkin.create({
        eventId: event.id,
        visitorId: person.id,
        checkpointId: checkpoint.id,
        createdAt: DateTime.fromISO(time, { zone: 'utc' }),
        deletedAt,
      })
    await stamp(complete, a, '2026-10-24T01:30:00Z')
    await stamp(complete, b, '2026-10-24T03:10:00Z')
    await stamp(partial, a, '2026-10-24T03:20:00Z')
    await stamp(partial, inactive, '2026-10-24T04:10:00Z')
    await stamp(waiting, a, '2026-10-24T04:20:00Z', DateTime.utc())
    await stamp(removed, a, '2026-10-24T04:20:00Z')
    await removed.softDelete()
    await stamp(complete, deleted, '2026-10-24T04:20:00Z')
    await deleted.softDelete()
    const excluded = await EventParticipation.query()
      .where('visitor_id', excludedEnrollment.id)
      .firstOrFail()
    await excluded.softDelete()
    const other = await createEvent()
    const otherCheckpoint = await other.cp('CP-001')
    await Checkin.create({
      eventId: other.event.id,
      visitorId: complete.id,
      checkpointId: otherCheckpoint.id,
    })
    const { authorization } = await admin()
    const response = await client
      .get(`/api/v1/admin/events/${event.id}/analytics`)
      .header('Authorization', authorization)
    response.assertStatus(200)
    const data = response.body().data
    assert.deepEqual(data.summary, {
      participants: 3,
      visitorsWithCheckins: 2,
      totalCheckins: 4,
      averageVisited: 1.33,
      completedPassports: 1,
      activeCheckpoints: 2,
    })
    assert.equal(data.timezone, 'America/Sao_Paulo')
    assert.equal(data.checkpoints.length, 4)
    assert.deepEqual(
      data.checkpoints.find((item: { id: number }) => item.id === zero.id),
      { id: zero.id, code: zero.code, name: zero.name, isActive: false, visits: 0 }
    )
    assert.equal(data.categories.find((item: { id: number }) => item.id === research.id).visits, 3)
    assert.equal(data.categories.find((item: { id: number }) => item.id === workshop.id).visits, 1)
    assert.deepEqual(data.daily, [
      { date: '2026-10-23', visits: 1 },
      { date: '2026-10-24', visits: 3 },
    ])
    assert.equal(data.hourly.length, 24)
    assert.equal(data.hourly[22].visits, 1)
    assert.equal(data.hourly[0].visits, 2)
    assert.equal(data.hourly[1].visits, 1)
    assert.deepEqual(
      data.progress.map((item: { count: number }) => item.count),
      [1, 0, 1, 0, 1]
    )
    const publicRanking = await client.get(`/api/v1/public/events/${event.slug}/ranking`)
    publicRanking.assertStatus(200)
    const entries = publicRanking.body().data.ranking.data
    assert.deepEqual(
      entries.map((entry: { position: number }) => entry.position),
      [1, 1, 3]
    )
    for (const entry of entries)
      assert.sameMembers(Object.keys(entry), ['nickname', 'visited', 'total', 'position'])
    assert.notInclude(JSON.stringify(publicRanking.body()), 'recovery')
    assert.notInclude(JSON.stringify(publicRanking.body()), 'visitorId')
    assert.notInclude(JSON.stringify(publicRanking.body()), removed.nickname)
    const participants = await client
      .get(`/api/v1/admin/participants?eventId=${event.id}`)
      .header('Authorization', authorization)
    participants.assertStatus(200)
    assert.equal(participants.body().metadata.total, 3)
    assert.notInclude(JSON.stringify(participants.body()), excludedEnrollment.nickname)
  })

  test('pagina ranking, valida página e bloqueia eventos excluídos e indicadores sem sessão', async ({
    client,
    assert,
  }) => {
    const { event } = await createEvent()
    for (let index = 0; index < 21; index++) {
      const person = await visitor()
      await EventParticipation.create({ eventId: event.id, visitorId: person.id })
    }
    const second = await client.get(`/api/v1/public/events/${event.slug}/ranking?page=2`)
    second.assertStatus(200)
    const result = second.body().data.ranking
    assert.equal(result.data.length, 1)
    assert.deepEqual(result.metadata, { total: 21, perPage: 20, currentPage: 2, lastPage: 2 })
    const statusResponse4 = await client.get(`/api/v1/public/events/${event.slug}/ranking?page=0`)
    statusResponse4.assertStatus(422)
    const statusResponse5 = await client.get(`/api/v1/admin/events/${event.id}/analytics`)
    statusResponse5.assertStatus(401)
    const statusResponse6 = await client.get(`/api/v1/admin/events/${event.id}/analytics/export`)
    statusResponse6.assertStatus(401)
    const { authorization } = await admin()
    await event.softDelete()
    const statusResponse7 = await client.get(`/api/v1/public/events/${event.slug}/ranking`)
    statusResponse7.assertStatus(404)
    const statusResponse8 = await client
      .get(`/api/v1/admin/events/${event.id}/analytics`)
      .header('Authorization', authorization)

    statusResponse8.assertStatus(404)
    const statusResponse9 = await client
      .get(`/api/v1/admin/events/${event.id}/analytics/export`)
      .header('Authorization', authorization)

    statusResponse9.assertStatus(404)
  })

  test('exporta CSV completo, neutraliza fórmulas e registra auditoria sem segredos', async ({
    client,
    assert,
  }) => {
    const { event, research, cp } = await createEvent(' =HYPERLINK("url")')
    research.name = '+SUM(1,2)'
    await research.save()
    const checkpoint = await cp('CP-001')
    checkpoint.name = '@cmd; "teste"'
    await checkpoint.save()
    const { person, authorization } = await admin()
    const response = await client
      .get(`/api/v1/admin/events/${event.id}/analytics/export`)
      .header('Authorization', authorization)
    response.assertStatus(200)
    assert.include(response.header('content-type'), 'text/csv')
    assert.include(response.header('content-disposition'), `indicadores-${event.id}.csv`)
    assert.include(response.text(), `"' =HYPERLINK(""url"")"`)
    assert.include(response.text(), `"'@cmd; ""teste"""`)
    assert.include(response.text(), `"'+SUM(1,2)"`)
    assert.include(response.text(), '"ponto";"CP-001";')
    assert.include(response.text(), '"progresso";')
    const audit = await AuditLog.query()
      .where('event_id', event.id)
      .where('action', 'download')
      .firstOrFail()
    assert.equal(audit.actorUserId, person.id)
    assert.deepEqual(audit.details, { format: 'csv', participants: 0, checkins: 0 })
    assert.notInclude(JSON.stringify(audit.details), 'token')
    for (const value of ['=cmd', '+cmd', '-cmd', '@cmd', ' \t=cmd', '\ttext', '\rtext', '\ntext']) {
      assert.isTrue(csvCell(value).startsWith('"\''))
    }
    assert.equal(csvCell(0), '"0"')
  })

  test('check-in registra inscrição na mesma transação e repetir QR mantém uma linha', async ({
    client,
    assert,
    db,
  }) => {
    const { event, cp } = await createEvent()
    const checkpoint = await cp('CP-001')
    const person = await visitor()
    const token = await VisitorToken.issue(person)
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await client
        .post('/api/v1/visitor/checkins')
        .header('X-Visitor-Token', token)
        .json({ qrToken: checkpoint.qrToken })
      result.assertStatus(200)
      assert.equal(result.body().data.alreadyCheckedIn, attempt > 0)
    }
    await db.assertHas('checkins', { visitor_id: person.id, checkpoint_id: checkpoint.id }, 1)
    await db.assertHas('event_participations', { visitor_id: person.id, event_id: event.id }, 1)
  })

  test('exclusão do evento propaga a inscrições e avaliações sem sobrescrever exclusões anteriores', async ({
    client,
    assert,
  }) => {
    const { event } = await createEvent()
    const active = await visitor()
    const removed = await visitor()
    const oldTimestamp = DateTime.fromISO('2026-10-20T12:00:00Z')
    await EventParticipation.create({ eventId: event.id, visitorId: active.id })
    await EventParticipation.create({
      eventId: event.id,
      visitorId: removed.id,
      deletedAt: oldTimestamp,
    })
    await database.table('event_evaluations').insert([
      {
        event_id: event.id,
        visitor_id: active.id,
        rating: 5,
        created_at: oldTimestamp.toSQL(),
        updated_at: oldTimestamp.toSQL(),
      },
      {
        event_id: event.id,
        visitor_id: removed.id,
        rating: 4,
        created_at: oldTimestamp.toSQL(),
        updated_at: oldTimestamp.toSQL(),
        deleted_at: oldTimestamp.toSQL(),
      },
    ])
    const { authorization } = await admin()
    const response = await client
      .delete(`/api/v1/admin/events/${event.id}`)
      .header('Authorization', authorization)
    response.assertStatus(204)
    const deletedEvent = await database.from('events').where('id', event.id).first()
    for (const table of ['event_participations', 'event_evaluations']) {
      const liveRow = await database
        .from(table)
        .where('event_id', event.id)
        .where('visitor_id', active.id)
        .first()
      const oldRow = await database
        .from(table)
        .where('event_id', event.id)
        .where('visitor_id', removed.id)
        .first()
      assert.equal(
        new Date(liveRow.deleted_at).getTime(),
        new Date(deletedEvent.deleted_at).getTime()
      )
      assert.equal(new Date(oldRow.deleted_at).getTime(), oldTimestamp.toMillis())
    }
  })
})

// Sem a transação global: requisições aqui precisam disputar conexões e índices reais.
test.group('Concorrência de inscrições e carimbos', () => {
  test('POSTs simultâneos mantêm exatamente uma inscrição e um carimbo', async ({
    client,
    assert,
  }) => {
    const { event, cp } = await createEvent()
    const checkpoint = await cp('CP-001')
    const person = await visitor()
    const token = await VisitorToken.issue(person)
    try {
      await Promise.all(
        Array.from({ length: 12 }, async () => {
          const response = await client
            .post(`/api/v1/visitor/passports/${event.slug}/join`)
            .header('X-Visitor-Token', token)
          response.assertStatus(200)
        })
      )
      const results = await Promise.all(
        Array.from({ length: 12 }, async () => {
          const response = await client
            .post('/api/v1/visitor/checkins')
            .header('X-Visitor-Token', token)
            .json({ qrToken: checkpoint.qrToken })
          response.assertStatus(200)
          return response.body().data
        })
      )
      assert.equal(results.filter((result) => !result.alreadyCheckedIn).length, 1)
      const participations = await EventParticipation.query().where('event_id', event.id)
      assert.equal(participations.length, 1)
      const checkins = await Checkin.query().where('event_id', event.id)
      assert.equal(checkins.length, 1)
    } finally {
      await database.transaction((trx) => event.softDelete(trx))
      await person.softDelete()
    }
  })
})
