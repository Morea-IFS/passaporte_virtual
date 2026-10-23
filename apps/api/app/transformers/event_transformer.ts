import type Event from '#models/event'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class EventTransformer extends BaseTransformer<Event> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'slug',
        'location',
        'hashtag',
        'description',
        'createdAt',
        'updatedAt',
      ]),
      startsOn: this.resource.startsOn.toISODate()!,
      endsOn: this.resource.endsOn.toISODate()!,
      checkpointsCount: Number(this.resource.$extras.checkpoints_count ?? 0),
      activeCheckpointsCount: Number(this.resource.$extras.active_checkpoints_count ?? 0),
    }
  }
}
