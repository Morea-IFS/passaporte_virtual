import vine from '@vinejs/vine'

export const auditFiltersValidator = vine.create({
  q: vine.string().trim().maxLength(200).optional(),
  actorId: vine.number().withoutDecimals().min(1).optional(),
  action: vine.enum(['create', 'update', 'activate', 'deactivate', 'delete', 'import']).optional(),
  resourceType: vine.enum(['administrator', 'event', 'checkpoint', 'category']).optional(),
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
