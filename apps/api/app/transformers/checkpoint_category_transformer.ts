import type CheckpointCategory from '#models/checkpoint_category'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class CheckpointCategoryTransformer extends BaseTransformer<CheckpointCategory> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'eventId', 'name', 'color', 'position']),
      checkpointsCount: Number(this.resource.$extras.checkpoints_count ?? 0),
    }
  }
}
