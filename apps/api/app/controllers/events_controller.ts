import Event from '#models/event'
import CheckpointCategory from '#models/checkpoint_category'
import db from '@adonisjs/lucid/services/db'
import { errors as vineErrors } from '@vinejs/vine'
import { DateTime } from 'luxon'

const EVENT_TIMEZONE = 'America/Sao_Paulo'
import EventTransformer from '#transformers/event_transformer'
import { createEventValidator, updateEventValidator } from '#validators/event'
import { PER_PAGE, pageValidator } from '#validators/pagination'
import type { HttpContext } from '@adonisjs/core/http'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { audit } from '#services/audit'

function withCounts(query: ModelQueryBuilderContract<typeof Event>) {
  return query
    .withCount('checkpoints', (checkpoints) => checkpoints.whereNull('deleted_at'))
    .withCount('checkpoints', (checkpoints) =>
      checkpoints.whereNull('deleted_at').where('is_active', true).as('active_checkpoints_count')
    )
}

/**
 * Início do evento não pode ser antes de hoje (fuso de Brasília; o servidor
 * roda em UTC). Na edição, só vale se a data de início mudou.
 */
function assertStartNotInPast(startsOn: DateTime, previous?: DateTime) {
  if (previous && startsOn.toISODate() === previous.toISODate()) return
  const today = DateTime.now().setZone(EVENT_TIMEZONE).toISODate()!
  if (startsOn.toISODate()! < today) {
    throw new vineErrors.E_VALIDATION_ERROR([
      {
        field: 'startsOn',
        rule: 'date.notInPast',
        message: 'O início não pode ser antes de hoje.',
      },
    ])
  }
}

export default class EventsController {
  async index({ request, serialize }: HttpContext) {
    const { page = 1 } = await pageValidator.validate(request.qs())
    const events = await withCounts(Event.query())
      .orderBy('starts_on', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, PER_PAGE)
    return serialize(EventTransformer.paginate(events.all(), events.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const event = await withCounts(Event.query()).where('id', params.id).firstOrFail()
    return serialize(EventTransformer.transform(event))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createEventValidator)
    assertStartNotInPast(payload.startsOn)
    const event = await db.transaction(async (trx) => {
      const slug = await Event.uniqueSlug(payload.name, trx)
      const created = await Event.create({ ...payload, slug }, { client: trx })
      await CheckpointCategory.createDefaults(created.id, trx)
      await audit(
        actor,
        {
          action: 'create',
          resourceType: 'event',
          resourceId: created.id,
          resourceName: created.name,
          eventId: created.id,
          details: {
            startsOn: created.startsOn.toISODate(),
            endsOn: created.endsOn.toISODate(),
            location: created.location,
          },
        },
        trx
      )
      return created
    })

    response.status(201)
    return serialize(EventTransformer.transform(event))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateEventValidator)
    const actor = auth.getUserOrFail()
    const eventId = Number(params.id)
    await db.transaction(async (trx) => {
      const event = await Event.query({ client: trx })
        .where('id', eventId)
        .forUpdate()
        .firstOrFail()
      assertStartNotInPast(payload.startsOn, event.startsOn)
      event.merge(payload)
      await event.save()
      await audit(
        actor,
        {
          action: 'update',
          resourceType: 'event',
          resourceId: event.id,
          resourceName: event.name,
          eventId: event.id,
          details: {
            startsOn: event.startsOn.toISODate(),
            endsOn: event.endsOn.toISODate(),
            location: event.location,
          },
        },
        trx
      )
    })

    const updated = await withCounts(Event.query()).where('id', eventId).firstOrFail()
    return serialize(EventTransformer.transform(updated))
  }

  /**
   * Exclusão lógica do evento e dos pontos dele (imagens ficam no storage).
   */
  async destroy({ auth, params, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    await db.transaction(async (trx) => {
      const event = await Event.query({ client: trx })
        .where('id', params.id)
        .forUpdate()
        .firstOrFail()
      await event.softDelete(trx)
      await audit(
        actor,
        {
          action: 'delete',
          resourceType: 'event',
          resourceId: event.id,
          resourceName: event.name,
          eventId: event.id,
        },
        trx
      )
    })

    return response.noContent()
  }
}
