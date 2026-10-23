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
import { audit } from '#services/audit'

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

  async store({ auth, params, request, response, serialize }: HttpContext) {
    const actor = auth.getUserOrFail()
    const event = await Event.findOrFail(params.eventId)
    const { image, logo, ...fields } = await request.validateUsing(createCheckpointValidator, {
      meta: { eventId: event.id },
    })

    const checkpoint = await db.transaction(async (trx) => {
      const sequence = await Checkpoint.nextSequence(event.id, trx)
      const created = await Checkpoint.create(
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
      await audit(
        actor,
        {
          action: 'create',
          resourceType: 'checkpoint',
          resourceId: created.id,
          resourceName: created.name,
          eventId: event.id,
          details: {
            code: created.code,
            categoryId: created.categoryId,
            isActive: created.isActive,
          },
        },
        trx
      )
      return created
    })

    await checkpoint.load('category')
    response.status(201)
    return serialize(CheckpointTransformer.transform(checkpoint))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const current = await Checkpoint.findOrFail(params.id)
    const { image, logo, removeImage, removeLogo, ...fields } = await request.validateUsing(
      updateCheckpointValidator,
      { meta: { eventId: current.eventId } }
    )
    const actor = auth.getUserOrFail()

    await db.transaction(async (trx) => {
      const checkpoint = await Checkpoint.query({ client: trx })
        .where('id', current.id)
        .forUpdate()
        .firstOrFail()
      checkpoint.merge(fields)
      await replaceCheckpointImage(checkpoint, 'imagePath', image, removeImage)
      await replaceCheckpointImage(checkpoint, 'logoPath', logo, removeLogo)
      await checkpoint.save()
      await audit(
        actor,
        {
          action: 'update',
          resourceType: 'checkpoint',
          resourceId: checkpoint.id,
          resourceName: checkpoint.name,
          eventId: checkpoint.eventId,
          details: { categoryId: checkpoint.categoryId, isActive: checkpoint.isActive },
        },
        trx
      )
    })

    const checkpoint = await Checkpoint.query()
      .where('id', current.id)
      .preload('category')
      .firstOrFail()

    return serialize(CheckpointTransformer.transform(checkpoint))
  }

  /**
   * Ativa ou desativa o checkpoint. Desativado não aceita novos check-ins,
   * mas os já feitos continuam valendo (RN04).
   */
  async updateStatus({ auth, params, request, serialize }: HttpContext) {
    const { isActive } = await request.validateUsing(checkpointStatusValidator)
    const actor = auth.getUserOrFail()
    const checkpointId = Number(params.id)
    await db.transaction(async (trx) => {
      const checkpoint = await Checkpoint.query({ client: trx })
        .where('id', checkpointId)
        .forUpdate()
        .firstOrFail()
      checkpoint.merge({ isActive })
      await checkpoint.save()
      await audit(
        actor,
        {
          action: isActive ? 'activate' : 'deactivate',
          resourceType: 'checkpoint',
          resourceId: checkpoint.id,
          resourceName: checkpoint.name,
          eventId: checkpoint.eventId,
          details: { isActive },
        },
        trx
      )
    })

    const checkpoint = await Checkpoint.query()
      .where('id', checkpointId)
      .preload('category')
      .firstOrFail()

    return serialize(CheckpointTransformer.transform(checkpoint))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    await db.transaction(async (trx) => {
      const checkpoint = await Checkpoint.query({ client: trx })
        .where('id', params.id)
        .forUpdate()
        .firstOrFail()
      await checkpoint.softDelete()
      await audit(
        actor,
        {
          action: 'delete',
          resourceType: 'checkpoint',
          resourceId: checkpoint.id,
          resourceName: checkpoint.name,
          eventId: checkpoint.eventId,
        },
        trx
      )
    })

    return response.noContent()
  }
}
