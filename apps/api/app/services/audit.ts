import AuditLog from '#models/audit_log'
import type User from '#models/user'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export type AuditAction = 'create' | 'update' | 'activate' | 'deactivate' | 'delete' | 'import'
export type AuditResource = 'administrator' | 'event' | 'checkpoint' | 'category'

type AuditEntry = {
  action: AuditAction
  resourceType: AuditResource
  resourceId?: number | string | null
  resourceName?: string | null
  eventId?: number | null
  details?: Record<string, string | number | boolean | null>
}

/** Recebe somente campos permitidos; nunca recebe o corpo cru da requisição. */
export async function audit(actor: User, entry: AuditEntry, trx?: TransactionClientContract) {
  return AuditLog.create(
    {
      actorUserId: actor.id,
      actorName: actor.fullName,
      actorEmail: actor.email,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId === undefined ? null : String(entry.resourceId),
      resourceName: entry.resourceName ?? null,
      eventId: entry.eventId ?? null,
      details: entry.details ?? {},
    },
    trx ? { client: trx } : undefined
  )
}
