import type Checkpoint from '#models/checkpoint'
import CheckpointCategoryTransformer from '#transformers/checkpoint_category_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class CheckpointTransformer extends BaseTransformer<Checkpoint> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'eventId',
        'code',
        'qrToken',
        'name',
        'categoryId',
        'summary',
        'location',
        'imageUrl',
        'logoUrl',
        'isActive',
        'checkinUrl',
        'createdAt',
        'updatedAt',
      ]),
      category: CheckpointCategoryTransformer.transform(this.whenLoaded(this.resource.category)),
    }
  }
}
