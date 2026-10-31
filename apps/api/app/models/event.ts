import { EventSchema } from '#database/schema'
import Checkpoint from '#models/checkpoint'
import { SoftDeletes } from '#models/mixins/soft_deletes'
import { compose } from '@adonisjs/core/helpers'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ª/g, 'a')
    .replace(/º/g, 'o')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/, '')
}

export default class Event extends compose(EventSchema, SoftDeletes) {
  @hasMany(() => Checkpoint)
  declare checkpoints: HasMany<typeof Checkpoint>

  /**
   * Link do evento gerado pelo nome ("23ª SNCT – Ciência Delas" →
   * "23a-snct-ciencia-delas"). Se já estiver em uso por um evento não
   * excluído, acrescenta -2, -3... Só é gerado na criação: renomear o
   * evento não muda o link (QR codes impressos continuam valendo).
   */
  static async uniqueSlug(name: string, trx?: TransactionClientContract) {
    const base = slugify(name) || 'evento'
    const rows: { slug: string }[] = await (trx ?? db)
      .from('events')
      .whereNull('deleted_at')
      .where((query) => query.where('slug', base).orWhereLike('slug', `${base}-%`))
      .select('slug')
    const taken = new Set(rows.map(({ slug }) => slug))
    if (!taken.has(base)) return base
    let suffix = 2
    while (taken.has(`${base}-${suffix}`)) suffix++
    return `${base}-${suffix}`
  }

  /**
   * Exclusão lógica do evento, pontos, inscrições e avaliações com o mesmo
   * deleted_at; preserva exclusões anteriores para permitir restauração conjunta.
   */
  async softDelete(trx?: TransactionClientContract) {
    const deletedAt = DateTime.now()
    await Checkpoint.query(trx ? { client: trx } : undefined)
      .where('event_id', this.id)
      .whereNull('deleted_at')
      .update({ deleted_at: deletedAt.toSQL(), updated_at: deletedAt.toSQL() })
    for (const table of ['event_participations', 'event_evaluations']) {
      await (trx ?? db)
        .from(table)
        .where('event_id', this.id)
        .whereNull('deleted_at')
        .update({ deleted_at: deletedAt.toSQL(), updated_at: deletedAt.toSQL() })
    }
    if (trx) this.useTransaction(trx)
    this.deletedAt = deletedAt
    await this.save()
  }
}
