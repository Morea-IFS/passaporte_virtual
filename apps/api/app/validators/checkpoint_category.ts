import vine from '@vinejs/vine'

/**
 * Nome único dentro do evento (sem diferenciar maiúsculas), entre categorias
 * não excluídas. Na edição, ignora a própria categoria.
 */
export const checkpointCategoryValidator = vine
  .withMetaData<{ eventId: number; categoryId?: number }>()
  .create({
    name: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(40)
      .unique(async (db, value, field) => {
        const existing = await db
          .from('checkpoint_categories')
          .where('event_id', field.meta.eventId)
          .whereNull('deleted_at')
          .whereRaw('lower(name) = lower(?)', [value])
          .if(field.meta.categoryId, (query) => query.whereNot('id', field.meta.categoryId))
          .first()
        return !existing
      }),
  })

/**
 * Destino dos pontos ao excluir uma categoria: outra categoria ativa
 * do mesmo evento.
 */
export const deleteCheckpointCategoryValidator = vine
  .withMetaData<{ eventId: number; categoryId: number }>()
  .create({
    moveToCategoryId: vine
      .number()
      .withoutDecimals()
      .exists(async (db, value, field) => {
        if (value === field.meta.categoryId) return false
        const target = await db
          .from('checkpoint_categories')
          .where('id', value)
          .where('event_id', field.meta.eventId)
          .whereNull('deleted_at')
          .first()
        return Boolean(target)
      })
      .optional(),
  })
