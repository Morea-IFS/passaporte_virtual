import { CheckinSchema } from '#database/schema'
import Checkpoint from '#models/checkpoint'
import Visitor from '#models/visitor'
import { SoftDeletes } from '#models/mixins/soft_deletes'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/** Carimbo: visitante passou pelo ponto (no máximo um por ponto, RN01) */
export default class Checkin extends compose(CheckinSchema, SoftDeletes) {
  @belongsTo(() => Visitor)
  declare visitor: BelongsTo<typeof Visitor>

  @belongsTo(() => Checkpoint)
  declare checkpoint: BelongsTo<typeof Checkpoint>
}
