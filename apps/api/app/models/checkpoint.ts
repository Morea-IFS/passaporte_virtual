import { CheckpointSchema } from '#database/schema'
import Event from '#models/event'
import CheckpointCategory from '#models/checkpoint_category'
import env from '#start/env'
import string from '@adonisjs/core/helpers/string'
import { SoftDeletes } from '#models/mixins/soft_deletes'
import { compose } from '@adonisjs/core/helpers'
import db from '@adonisjs/lucid/services/db'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export default class Checkpoint extends compose(CheckpointSchema, SoftDeletes) {
  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => CheckpointCategory, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof CheckpointCategory>

  get imageUrl() {
    return Checkpoint.publicUrl(this.imagePath)
  }

  get logoUrl() {
    return Checkpoint.publicUrl(this.logoPath)
  }

  /**
   * Token aleatório usado na URL do QR code. Não dá para adivinhar
   * a URL de um checkpoint a partir do código sequencial.
   */
  @beforeCreate()
  static assignQrToken(checkpoint: Checkpoint) {
    checkpoint.qrToken ??= string.random(24)
  }

  static publicUrl(path: string | null) {
    return path ? `${env.get('APP_URL')}/uploads/${path}` : null
  }

  static formatCode(sequence: number) {
    return `CP-${String(sequence).padStart(3, '0')}`
  }

  /**
   * Próximo número sequencial de código (CP-001, CP-002...) dentro do evento.
   * Conta também os excluídos, para um código nunca ser reaproveitado
   * (e um ponto restaurado não colidir com outro).
   */
  static async nextSequence(eventId: number, trx?: TransactionClientContract) {
    const codes: { code: string }[] = await (trx ?? db)
      .from('checkpoints')
      .where('event_id', eventId)
      .select('code')
    const max = codes.reduce((highest, { code }) => {
      const sequence = Number(code.replace(/^CP-/, ''))
      return Number.isFinite(sequence) && sequence > highest ? sequence : highest
    }, 0)
    return max + 1
  }
}
