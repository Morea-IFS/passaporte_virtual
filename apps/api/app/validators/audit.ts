import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '#services/audit'
import vine from '@vinejs/vine'

export const auditFiltersValidator = vine.create({
  q: vine.string().trim().maxLength(200).optional(),
  actorId: vine.number().withoutDecimals().min(1).optional(),
  action: vine.enum(AUDIT_ACTIONS).optional(),
  resourceType: vine.enum(AUDIT_RESOURCES).optional(),
  eventId: vine.number().withoutDecimals().min(1).optional(),
  from: vine.date({ formats: ['YYYY-MM-DD'] }).optional(),
  to: vine.date({ formats: ['YYYY-MM-DD'] }).optional(),
  page: vine.number().withoutDecimals().min(1).optional(),
})

export const participantFiltersValidator = vine.create({
  q: vine.string().trim().maxLength(20).optional(),
  eventId: vine.number().withoutDecimals().min(1).optional(),
  page: vine.number().withoutDecimals().min(1).optional(),
})

/** Tela aberta ou arquivo baixado no painel, informado pelo web */
export const auditTrackValidator = vine.create({
  action: vine.enum(['view', 'download']),
  path: vine.string().trim().startsWith('/').maxLength(200),
})
