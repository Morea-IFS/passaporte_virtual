import { CheckpointCategorySchema } from '#database/schema'
import Checkpoint from '#models/checkpoint'
import Event from '#models/event'
import { SoftDeletes } from '#models/mixins/soft_deletes'
import { compose } from '@adonisjs/core/helpers'
import db from '@adonisjs/lucid/services/db'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Cores da marca disponíveis para categorias, na ordem de preferência.
 * O violeta fica de fora: é a cor de destaque e do quarto de círculo
 * das miniaturas. A mesma lista (com as classes) existe no web.
 */
export const CATEGORY_COLORS = [
  'azul',
  'laranja',
  'magenta',
  'verde',
  'turquesa',
  'amarelo',
] as const
export type CategoryColor = (typeof CATEGORY_COLORS)[number]

/** Categorias com que todo evento novo nasce */
export const DEFAULT_CATEGORIES = ['Pesquisa', 'Oficina', 'Apresentação', 'Cultural', 'Curso']

export default class CheckpointCategory extends compose(CheckpointCategorySchema, SoftDeletes) {
  declare color: CategoryColor

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @hasMany(() => Checkpoint, { foreignKey: 'categoryId' })
  declare checkpoints: HasMany<typeof Checkpoint>

  /**
   * Cor automática: a da paleta menos usada entre as categorias ativas
   * do evento (empate: a primeira na ordem da paleta).
   */
  static async nextColor(eventId: number, trx?: TransactionClientContract) {
    const rows: { color: string; total: string }[] = await (trx ?? db)
      .from('checkpoint_categories')
      .where('event_id', eventId)
      .whereNull('deleted_at')
      .groupBy('color')
      .select('color')
      .count('* as total')
    const usage = new Map(rows.map(({ color, total }) => [color, Number(total)]))

    return CATEGORY_COLORS.reduce((best, color) =>
      (usage.get(color) ?? 0) < (usage.get(best) ?? 0) ? color : best
    )
  }

  static async nextPosition(eventId: number, trx?: TransactionClientContract) {
    const row = await (trx ?? db)
      .from('checkpoint_categories')
      .where('event_id', eventId)
      .max('position as max')
      .first()
    return row?.max === null || row?.max === undefined ? 0 : Number(row.max) + 1
  }

  /**
   * Cria uma categoria com cor e posição automáticas.
   */
  static async createFor(eventId: number, name: string, trx?: TransactionClientContract) {
    return CheckpointCategory.create(
      {
        eventId,
        name,
        color: await CheckpointCategory.nextColor(eventId, trx),
        position: await CheckpointCategory.nextPosition(eventId, trx),
      },
      { client: trx }
    )
  }

  static async createDefaults(eventId: number, trx?: TransactionClientContract) {
    for (const name of DEFAULT_CATEGORIES) {
      await CheckpointCategory.createFor(eventId, name, trx)
    }
  }
}
