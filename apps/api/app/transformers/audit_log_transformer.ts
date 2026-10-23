import type AuditLog from '#models/audit_log'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class AuditLogTransformer extends BaseTransformer<AuditLog> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'actorUserId',
      'actorName',
      'actorEmail',
      'action',
      'resourceType',
      'resourceId',
      'resourceName',
      'eventId',
      'details',
      'createdAt',
    ])
  }
}
