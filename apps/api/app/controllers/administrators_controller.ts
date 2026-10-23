import User from '#models/user'
import UserTransformer from '#transformers/user_transformer'
import { audit } from '#services/audit'
import {
  administratorFiltersValidator,
  administratorStatusValidator,
  createAdministratorValidator,
  updateAdministratorValidator,
} from '#validators/administrator'
import { PER_PAGE } from '#validators/pagination'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as vineErrors } from '@vinejs/vine'

function validation(field: string | undefined, message: string): never {
  throw new vineErrors.E_VALIDATION_ERROR([{ field, rule: 'business', message }])
}

async function assertEmailAvailable(email: string, exceptId?: number) {
  const found = await db
    .from('users')
    .whereRaw('lower(email) = lower(?)', [email])
    .if(exceptId, (query) => query.whereNot('id', exceptId!))
    .first()
  if (found) validation('email', 'Este e-mail já está em uso.')
}

export default class AdministratorsController {
  async index({ request, serialize }: HttpContext) {
    const { q, status, page = 1 } = await administratorFiltersValidator.validate(request.qs())
    const users = await User.query()
      .if(q, (query) =>
        query.where((search) =>
          search.whereILike('full_name', `%${q}%`).orWhereILike('email', `%${q}%`)
        )
      )
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy('full_name', 'asc')
      .orderBy('id', 'asc')
      .paginate(page, PER_PAGE)
    return serialize(UserTransformer.paginate(users.all(), users.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(await User.findOrFail(params.id)))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createAdministratorValidator)
    await assertEmailAvailable(payload.email)
    const user = await db.transaction(async (trx) => {
      const created = await User.create({ ...payload, isActive: true }, { client: trx })
      await audit(
        actor,
        {
          action: 'create',
          resourceType: 'administrator',
          resourceId: created.id,
          resourceName: created.email,
          details: { fullName: created.fullName, email: created.email },
        },
        trx
      )
      return created
    })
    response.status(201)
    return serialize(UserTransformer.transform(user))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const actor = auth.getUserOrFail()
    const user = await User.findOrFail(params.id)
    const payload = await request.validateUsing(updateAdministratorValidator)
    await assertEmailAvailable(payload.email, user.id)
    const previous = { fullName: user.fullName, email: user.email }
    await db.transaction(async (trx) => {
      user.useTransaction(trx)
      user.merge(payload)
      await user.save()
      await audit(
        actor,
        {
          action: 'update',
          resourceType: 'administrator',
          resourceId: user.id,
          resourceName: user.email,
          details: {
            previousName: previous.fullName,
            fullName: user.fullName,
            previousEmail: previous.email,
            email: user.email,
            passwordChanged: Boolean(payload.password),
          },
        },
        trx
      )
    })
    return serialize(UserTransformer.transform(user))
  }

  async updateStatus({ auth, params, request, serialize }: HttpContext) {
    const actor = auth.getUserOrFail()
    const targetId = Number(params.id)
    const { isActive } = await request.validateUsing(administratorStatusValidator)
    if (!isActive && actor.id === targetId)
      validation(undefined, 'Você não pode desativar a própria conta.')

    const user = await db.transaction(async (trx) => {
      // Todas as contas ativas são bloqueadas na mesma ordem. Assim,
      // desativações concorrentes nunca conseguem remover as duas últimas.
      const active = await trx
        .from('users')
        .whereNull('deleted_at')
        .where('is_active', true)
        .orderBy('id', 'asc')
        .forUpdate()
      const target = await User.query({ client: trx })
        .where('id', targetId)
        .forUpdate()
        .firstOrFail()
      if (!isActive && target.isActive) {
        if (active.length <= 1)
          validation(undefined, 'O último administrador ativo não pode ser desativado.')
      }
      target.useTransaction(trx)
      target.isActive = isActive
      await target.save()
      if (!isActive) await trx.from('auth_access_tokens').where('tokenable_id', target.id).delete()
      await audit(
        actor,
        {
          action: isActive ? 'activate' : 'deactivate',
          resourceType: 'administrator',
          resourceId: target.id,
          resourceName: target.email,
        },
        trx
      )
      return target
    })
    return serialize(UserTransformer.transform(user))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const targetId = Number(params.id)
    if (actor.id === targetId) validation(undefined, 'Você não pode remover a própria conta.')

    await db.transaction(async (trx) => {
      const active = await trx
        .from('users')
        .whereNull('deleted_at')
        .where('is_active', true)
        .orderBy('id', 'asc')
        .forUpdate()
      const user = await User.query({ client: trx }).where('id', targetId).forUpdate().firstOrFail()
      if (user.isActive && active.length <= 1)
        validation(undefined, 'O último administrador ativo não pode ser removido.')
      await audit(
        actor,
        {
          action: 'delete',
          resourceType: 'administrator',
          resourceId: user.id,
          resourceName: user.email,
        },
        trx
      )
      await trx.from('auth_access_tokens').where('tokenable_id', user.id).delete()
      user.useTransaction(trx)
      user.isActive = false
      await user.softDelete()
    })
    return response.noContent()
  }
}
