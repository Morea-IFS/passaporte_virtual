import AuditLog from '#models/audit_log'
import Event from '#models/event'
import User from '#models/user'
import AuditLogTransformer from '#transformers/audit_log_transformer'
import UserTransformer from '#transformers/user_transformer'
import { auditFiltersValidator } from '#validators/audit'
import { PER_PAGE } from '#validators/pagination'
import type { HttpContext } from '@adonisjs/core/http'

export default class AuditLogsController {
  async index({ request, serialize }: HttpContext) {
    const filters = await auditFiltersValidator.validate(request.qs())
    const logs = await AuditLog.query()
      .if(filters.q, (query) =>
        query.where((search) => {
          search
            .whereILike('actor_name', `%${filters.q}%`)
            .orWhereILike('actor_email', `%${filters.q}%`)
            .orWhereILike('resource_name', `%${filters.q}%`)
            .orWhereILike('resource_id', `%${filters.q}%`)
        })
      )
      .if(filters.actorId, (query) => query.where('actor_user_id', filters.actorId!))
      .if(filters.action, (query) => query.where('action', filters.action!))
      .if(filters.resourceType, (query) => query.where('resource_type', filters.resourceType!))
      .if(filters.eventId, (query) => query.where('event_id', filters.eventId!))
      .if(filters.from, (query) =>
        query.where('created_at', '>=', filters.from!.startOf('day').toSQL()!)
      )
      .if(filters.to, (query) => query.where('created_at', '<=', filters.to!.endOf('day').toSQL()!))
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(filters.page ?? 1, PER_PAGE)
    return serialize(AuditLogTransformer.paginate(logs.all(), logs.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    return serialize(AuditLogTransformer.transform(await AuditLog.findOrFail(params.id)))
  }

  async options({ serialize }: HttpContext) {
    const [administrators, events] = await Promise.all([
      User.query().orderBy('full_name', 'asc'),
      Event.query().select(['id', 'name']).orderBy('name', 'asc'),
    ])
    return serialize({
      administrators: UserTransformer.transform(administrators),
      events: events.map(({ id, name }) => ({ id, name })),
    })
  }
}
