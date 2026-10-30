import { EventParticipationSchema } from '#database/schema'
import Event from '#models/event'
import Visitor from '#models/visitor'
import { SoftDeletes } from '#models/mixins/soft_deletes'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class EventParticipation extends compose(EventParticipationSchema, SoftDeletes) {
  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => Visitor)
  declare visitor: BelongsTo<typeof Visitor>
}
