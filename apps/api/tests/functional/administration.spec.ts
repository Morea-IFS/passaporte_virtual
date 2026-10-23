import AuditLog from '#models/audit_log'
import Checkin from '#models/checkin'
import Checkpoint from '#models/checkpoint'
import CheckpointCategory from '#models/checkpoint_category'
import Event from '#models/event'
import User from '#models/user'
import Visitor from '#models/visitor'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

test.group('Administração, auditoria e participantes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function admin() {
    const suffix = randomUUID().slice(0, 8)
    const user = await User.create({
      fullName: 'Administrador Teste',
      email: `admin-${suffix}@example.com`,
      password: 'senha-segura',
      isActive: true,
    })
    const token = await User.accessTokens.create(user)
    return { user, authorization: `Bearer ${token.value!.release()}` }
  }

  test('gerencia administradores, invalida acesso e audita sem expor senha', async ({
    client,
    assert,
    db,
  }) => {
    const { authorization } = await admin()
    const email = `novo-${randomUUID().slice(0, 8)}@example.com`
    const created = await client
      .post('/api/v1/admin/administrators')
      .header('Authorization', authorization)
      .json({
        fullName: 'Nova Pessoa',
        email,
        password: 'outra-senha-segura',
      })
    created.assertStatus(201)
    assert.notProperty(created.body().data, 'password')
    const id = (created.body().data as { id: number }).id

    const target = await User.findOrFail(id)
    const targetToken = await User.accessTokens.create(target)
    const disabled = await client
      .patch(`/api/v1/admin/administrators/${id}/status`)
      .header('Authorization', authorization)
      .json({ isActive: false })
    disabled.assertStatus(200)
    disabled.assertBodyContains({ data: { isActive: false } })

    const denied = await client
      .get('/api/v1/account/profile')
      .header('Authorization', `Bearer ${targetToken.value!.release()}`)
    denied.assertStatus(401)

    const loginDenied = await client.post('/api/v1/auth/login').json({
      email,
      password: 'outra-senha-segura',
    })
    loginDenied.assertStatus(400)

    await db.assertHas('audit_logs', {
      resource_type: 'administrator',
      resource_id: String(id),
      action: 'create',
    })
    const logs = await client
      .get('/api/v1/admin/audit-logs?resourceType=administrator')
      .header('Authorization', authorization)
    logs.assertStatus(200)
    assert.isAtLeast(logs.body().data.length, 2)
    assert.notInclude(JSON.stringify(logs.body()), 'outra-senha-segura')
  })

  test('protege a própria conta e o último administrador ativo', async ({ client }) => {
    const { user, authorization } = await admin()
    const self = await client
      .patch(`/api/v1/admin/administrators/${user.id}/status`)
      .header('Authorization', authorization)
      .json({ isActive: false })
    self.assertStatus(422)
    self.assertBodyContains({ errors: [{ message: 'Você não pode desativar a própria conta.' }] })
  })

  test('lista participante com eventos, progresso e checkpoints sem dados secretos', async ({
    client,
    assert,
  }) => {
    const { authorization } = await admin()
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
    const visited = await Checkpoint.create({
      eventId: event.id,
      categoryId: category.id,
      code: 'CP-001',
      name: 'Visitado',
      isActive: true,
    })
    await Checkpoint.create({
      eventId: event.id,
      categoryId: category.id,
      code: 'CP-002',
      name: 'Pendente',
      isActive: true,
    })
    const visitor = new Visitor()
    visitor.nickname = `pessoa-${suffix}`
    visitor.recoveryCode = 'ABCD-EFGH'
    await visitor.save()
    await Checkin.create({ visitorId: visitor.id, eventId: event.id, checkpointId: visited.id })

    const listing = await client
      .get(`/api/v1/admin/participants?eventId=${event.id}`)
      .header('Authorization', authorization)
    listing.assertStatus(200)
    listing.assertBodyContains({
      data: [
        {
          nickname: visitor.nickname,
          totalCheckins: 1,
          events: [{ id: event.id, visited: 1, total: 2 }],
        },
      ],
    })
    assert.notInclude(JSON.stringify(listing.body()), 'recovery')

    const detail = await client
      .get(`/api/v1/admin/participants/${visitor.id}`)
      .header('Authorization', authorization)
    detail.assertStatus(200)
    detail.assertBodyContains({ data: { events: [{ id: event.id, visited: 1, total: 2 }] } })

    const checkins = await client
      .get(`/api/v1/admin/participants/${visitor.id}/checkins`)
      .header('Authorization', authorization)
    checkins.assertStatus(200)
    checkins.assertBodyContains({
      data: [{ code: 'CP-001', name: 'Visitado', eventName: event.name }],
      metadata: { perPage: 20, total: 1 },
    })
  })

  test('audita login, login recusado, telas abertas e logout', async ({ client, assert }) => {
    const { user } = await admin()
    const actions = async () => {
      const logs = await AuditLog.query().where('actor_email', user.email).orderBy('id', 'asc')
      return logs.map((log) => `${log.action}:${log.resourceType}:${log.resourceName ?? ''}`)
    }

    const failed = await client
      .post('/api/v1/auth/login')
      .json({ email: user.email, password: 'senha-errada' })
    failed.assertStatus(400)

    const login = await client
      .post('/api/v1/auth/login')
      .json({ email: user.email, password: 'senha-segura' })
    login.assertStatus(200)
    const authorization = `Bearer ${login.body().data.token}`

    const view = await client
      .post('/api/v1/admin/audit-logs/track')
      .header('Authorization', authorization)
      .json({ action: 'view', path: '/admin/participantes?pagina=2' })
    view.assertStatus(204)

    const logout = await client
      .post('/api/v1/account/logout')
      .header('Authorization', authorization)
    logout.assertStatus(200)

    assert.deepEqual(await actions(), [
      'login_failed:session:',
      'login:session:',
      'view:page:/admin/participantes?pagina=2',
      'logout:session:',
    ])
    const logs = await AuditLog.query().where('actor_email', user.email)
    assert.notInclude(JSON.stringify(logs), 'senha-segura')
    assert.notInclude(JSON.stringify(logs), 'senha-errada')
  })
})
