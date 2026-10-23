import AuditLog from '#models/audit_log'
import type User from '#models/user'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export const AUDIT_ACTIONS = [
  'create',
  'update',
  'activate',
  'deactivate',
  'delete',
  'import',
  'login',
  'login_failed',
  'logout',
  'view',
  'download',
] as const
export const AUDIT_RESOURCES = [
  'administrator',
  'event',
  'checkpoint',
  'category',
  'session',
  'page',
  'file',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]
export type AuditResource = (typeof AUDIT_RESOURCES)[number]

type AuditEntry = {
  action: AuditAction
  resourceType: AuditResource
  resourceId?: number | string | null
  resourceName?: string | null
  eventId?: number | null
  details?: Record<string, string | number | boolean | null>
}

/** Quem fez a ação; só o e-mail quando não há conta (login recusado). */
type AuditActor = User | { email: string }

/** Recebe somente campos permitidos; nunca recebe o corpo cru da requisição. */
export async function audit(actor: AuditActor, entry: AuditEntry, trx?: TransactionClientContract) {
  const user = 'id' in actor ? actor : null
  return AuditLog.create(
    {
      actorUserId: user?.id ?? null,
      actorName: user?.fullName ?? null,
      actorEmail: actor.email.slice(0, 254),
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId === undefined ? null : String(entry.resourceId),
      resourceName: entry.resourceName?.slice(0, 200) ?? null,
      eventId: entry.eventId ?? null,
      details: entry.details ?? {},
    },
    trx ? { client: trx } : undefined
  )
}
