import vine from '@vinejs/vine'

/** Apelido: 3 a 20 caracteres, letras sem acento, números, ponto, hífen e _ */
export const nicknameRule = () =>
  vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(20)
    .regex(/^[A-Za-z0-9._-]+$/)

export const registerVisitorValidator = vine.create({
  eventSlug: vine.string().trim().maxLength(100).optional(),
  nickname: nicknameRule().unique(async (db, value) => {
    const existing = await db
      .from('visitors')
      .whereNull('deleted_at')
      .whereRaw('lower(nickname) = lower(?)', [value])
      .first()
    return !existing
  }),
})

export const nicknameAvailabilityValidator = vine.create({
  nickname: nicknameRule(),
})

export const recoverVisitorValidator = vine.create({
  nickname: vine.string().trim().maxLength(20),
  code: vine.string().trim().maxLength(20),
})

export const checkinValidator = vine.create({
  qrToken: vine.string().trim().maxLength(64),
})
