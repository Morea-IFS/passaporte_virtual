import vine from '@vinejs/vine'

const image = () => vine.file({ size: '5mb', extnames: ['jpg', 'jpeg', 'png', 'webp'] })

/**
 * Campos de texto de um checkpoint. Reaproveitados na importação em lote
 * (lá a categoria vem pelo nome e é resolvida no controller).
 */
const textFields = {
  name: vine.string().trim().minLength(2).maxLength(160),
  summary: vine.string().trim().maxLength(1000).nullable().optional(),
  location: vine.string().trim().maxLength(160).nullable().optional(),
}

/**
 * A categoria precisa ser uma categoria ativa do mesmo evento do ponto.
 */
const categoryId = () =>
  vine
    .number()
    .withoutDecimals()
    .exists(async (db, value, field) => {
      const category = await db
        .from('checkpoint_categories')
        .where('id', value)
        .where('event_id', field.meta.eventId)
        .whereNull('deleted_at')
        .first()
      return Boolean(category)
    })

export const createCheckpointValidator = vine.withMetaData<{ eventId: number }>().create({
  ...textFields,
  categoryId: categoryId(),
  isActive: vine.boolean().optional(),
  image: image().optional(),
  logo: image().optional(),
})

export const updateCheckpointValidator = vine.withMetaData<{ eventId: number }>().create({
  ...textFields,
  categoryId: categoryId(),
  isActive: vine.boolean().optional(),
  image: image().optional(),
  logo: image().optional(),
  removeImage: vine.boolean().optional(),
  removeLogo: vine.boolean().optional(),
})

export const checkpointStatusValidator = vine.create({
  isActive: vine.boolean(),
})

export const qrCodesExportValidator = vine.create({
  layout: vine.enum(['cartaz', 'etiquetas', 'entrada']),
  ids: vine
    .string()
    .regex(/^\d+(,\d+)*$/)
    .optional(),
  includeInactive: vine.boolean().optional(),
})

export const checkpointFiltersValidator = vine.create({
  categoryId: vine.number().withoutDecimals().optional(),
  status: vine.enum(['active', 'inactive']).optional(),
  q: vine.string().trim().maxLength(160).optional(),
  page: vine.number().withoutDecimals().min(1).optional(),
})

export const importCheckpointsValidator = vine.create({
  file: vine.file({ size: '5mb', extnames: ['csv', 'txt', 'xlsx', 'xls', 'ods'] }),
  dryRun: vine.boolean().optional(),
})

export const checkpointRowValidator = vine.create(textFields)
