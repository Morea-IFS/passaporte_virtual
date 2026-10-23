import vine from '@vinejs/vine'

const email = () => vine.string().trim().toLowerCase().email().maxLength(254)

export const administratorFiltersValidator = vine.create({
  q: vine.string().trim().maxLength(160).optional(),
  status: vine.enum(['active', 'inactive']).optional(),
  page: vine.number().withoutDecimals().min(1).optional(),
})

export const createAdministratorValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(160),
  email: email(),
  password: vine.string().minLength(8).maxLength(200),
})

export const updateAdministratorValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(160),
  email: email(),
  password: vine.string().minLength(8).maxLength(200).optional(),
})

export const administratorStatusValidator = vine.create({ isActive: vine.boolean() })
