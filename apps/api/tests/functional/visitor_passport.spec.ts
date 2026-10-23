import Checkpoint from '#models/checkpoint'
import CheckpointCategory from '#models/checkpoint_category'
import Event from '#models/event'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

test.group('Passaporte do visitante', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createCheckpoint(isActive = true) {
    const suffix = randomUUID().slice(0, 8)
    const event = await Event.create({
      name: `Evento ${suffix}`,
      slug: `evento-${suffix}`,
      startsOn: DateTime.fromISO('2026-10-23'),
      endsOn: DateTime.fromISO('2026-10-24'),
    })
    const category = await CheckpointCategory.create({
      eventId: event.id,
      name: 'Pesquisa',
      color: 'azul',
      position: 0,
    })
    const checkpoint = await Checkpoint.create({
      eventId: event.id,
      categoryId: category.id,
      code: 'CP-001',
      name: 'Projeto de teste',
      isActive,
    })

    return { checkpoint, event }
  }

  test('cadastra, autentica, carimba uma unica vez e recupera em outro dispositivo', async ({
    client,
    assert,
    db,
  }) => {
    const { checkpoint, event } = await createCheckpoint()
    const nickname = `teste-${randomUUID().slice(0, 8)}`

    const registration = await client.post('/api/v1/visitor').json({ nickname })
    registration.assertStatus(201)
    const account = registration.body().data as {
      token: string
      nickname: string
      recoveryCode: string
    }
    assert.equal(account.nickname, nickname)
    assert.match(account.recoveryCode, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)

    const firstCheckin = await client
      .post('/api/v1/visitor/checkins')
      .header('X-Visitor-Token', account.token)
      .json({ qrToken: checkpoint.qrToken })
    firstCheckin.assertStatus(200)
    firstCheckin.assertBodyContains({
      data: {
        alreadyCheckedIn: false,
        nickname,
        progress: { visited: 1, total: 1 },
        event: { slug: event.slug, name: event.name },
      },
    })

    const repeatedCheckin = await client
      .post('/api/v1/visitor/checkins')
      .header('X-Visitor-Token', account.token)
      .json({ qrToken: checkpoint.qrToken })
    repeatedCheckin.assertStatus(200)
    repeatedCheckin.assertBodyContains({ data: { alreadyCheckedIn: true } })
    await db.assertHas('checkins', { checkpoint_id: checkpoint.id }, 1)

    const recovery = await client.post('/api/v1/visitor/recover').json({
      nickname: nickname.toUpperCase(),
      code: account.recoveryCode.toLowerCase().replace('-', ' '),
    })
    recovery.assertStatus(200)
    const recoveredToken = recovery.body().data.token as string
    assert.notEqual(recoveredToken, account.token)

    const me = await client.get('/api/v1/visitor/me').header('X-Visitor-Token', recoveredToken)
    me.assertStatus(200)
    me.assertBodyContains({ data: { nickname, recoveryCode: account.recoveryCode } })
  })

  test('nao aceita carimbo novo em checkpoint desativado', async ({ client, db }) => {
    const { checkpoint } = await createCheckpoint(false)
    const registration = await client
      .post('/api/v1/visitor')
      .json({ nickname: `teste-${randomUUID().slice(0, 8)}` })
    const token = registration.body().data.token as string

    const response = await client
      .post('/api/v1/visitor/checkins')
      .header('X-Visitor-Token', token)
      .json({ qrToken: checkpoint.qrToken })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ message: 'Este ponto não está recebendo carimbos agora.' }],
    })
    await db.assertMissing('checkins', { checkpoint_id: checkpoint.id })
  })
})
