import Event from '#models/event'
import Checkpoint from '#models/checkpoint'
import CheckpointTransformer from '#transformers/checkpoint_transformer'
import { replaceCheckpointImage, storeCheckpointImage } from '#services/checkpoint_files'
import {
  checkpointFiltersValidator,
  checkpointStatusValidator,
  createCheckpointValidator,
  updateCheckpointValidator,
} from '#validators/checkpoint'
import { PER_PAGE } from '#validators/pagination'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

export default class CheckpointsController {
  async index({ params, request, serialize }: HttpContext) {
    const event = await Event.findOrFail(params.eventId)
    const {
      categoryId,
      status,
      q,
      page = 1,
    } = await checkpointFiltersValidator.validate(request.qs())

    const checkpoints = await Checkpoint.query()
      .where('event_id', event.id)
      .preload('category')
      .if(categoryId, (query) => query.where('category_id', categoryId!))
      .if(status, (query) => query.where('is_active', status === 'active'))
      .if(q, (query) =>
        query.where((search) => {
          search.whereILike('name', `%${q}%`).orWhereILike('code', `%${q}%`)
        })
      )
      .orderBy('code', 'asc')
      .paginate(page, PER_PAGE)

    return serialize(CheckpointTransformer.paginate(checkpoints.all(), checkpoints.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const checkpoint = await Checkpoint.query()
      .where('id', params.id)
      .preload('category')
      .firstOrFail()
    return serialize(CheckpointTransformer.transform(checkpoint))
  }

  async store({ params, request, response, serialize }: HttpContext) {
    const event = await Event.findOrFail(params.eventId)
    const { image, logo, ...fields } = await request.validateUsing(createCheckpointValidator, {
      meta: { eventId: event.id },
    })

    const checkpoint = await db.transaction(async (trx) => {
      const sequence = await Checkpoint.nextSequence(event.id, trx)
      return Checkpoint.create(
        {
          ...fields,
          eventId: event.id,
          code: Checkpoint.formatCode(sequence),
          isActive: fields.isActive ?? true,
          imagePath: image ? await storeCheckpointImage(event.id, image) : null,
          logoPath: logo ? await storeCheckpointImage(event.id, logo) : null,
        },
        { client: trx }
      )
    })

    await checkpoint.load('category')
    response.status(201)
    return serialize(CheckpointTransformer.transform(checkpoint))
  }

  async update({ params, request, serialize }: HttpContext) {
    const checkpoint = await Checkpoint.findOrFail(params.id)
    const { image, logo, removeImage, removeLogo, ...fields } = await request.validateUsing(
      updateCheckpointValidator,
      { meta: { eventId: checkpoint.eventId } }
    )

    checkpoint.merge(fields)
    await replaceCheckpointImage(checkpoint, 'imagePath', image, removeImage)
    await replaceCheckpointImage(checkpoint, 'logoPath', logo, removeLogo)
    await checkpoint.save()
    await checkpoint.load('category')

    return serialize(CheckpointTransformer.transform(checkpoint))
  }

  /**
   * Ativa ou desativa o checkpoint. Desativado não aceita novos check-ins,
   * mas os já feitos continuam valendo (RN04).
   */
  async updateStatus({ params, request, serialize }: HttpContext) {
    const checkpoint = await Checkpoint.findOrFail(params.id)
    const { isActive } = await request.validateUsing(checkpointStatusValidator)

    await checkpoint.merge({ isActive }).save()
    await checkpoint.load('category')

    return serialize(CheckpointTransformer.transform(checkpoint))
  }

  async destroy({ params, response }: HttpContext) {
    const checkpoint = await Checkpoint.findOrFail(params.id)

    await checkpoint.softDelete()

    return response.noContent()
  }
}
