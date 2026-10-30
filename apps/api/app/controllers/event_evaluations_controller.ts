import Event from '#models/event'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'

const ratingValidator = vine.create({ rating: vine.number().withoutDecimals().range([1, 5]) })

export default class EventEvaluationsController {
  async show({ params, visitor }: HttpContext) {
    const event = await Event.query().where('slug', params.slug).firstOrFail()
    const evaluation = await db
      .from('event_evaluations')
      .where('event_id', event.id)
      .where('visitor_id', visitor.id)
      .whereNull('deleted_at')
      .first()
    return {
      data: {
        mode: event.evaluationMode,
        url: event.evaluationUrl,
        rating: evaluation?.rating ?? null,
      },
    }
  }

  async store({ params, request, response, visitor }: HttpContext) {
    const { rating } = await request.validateUsing(ratingValidator)
    return db.transaction(async (trx) => {
      const event = await Event.query({ client: trx })
        .where('slug', params.slug)
        .forShare()
        .firstOrFail()
      if (event.evaluationMode !== 'integrated') {
        return response.unprocessableEntity({
          errors: [{ message: 'Este evento utiliza um formulário externo de avaliação.' }],
        })
      }
      await trx.rawQuery(
        `INSERT INTO event_evaluations (event_id, visitor_id, rating, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (visitor_id, event_id) WHERE deleted_at IS NULL
      DO UPDATE SET rating = EXCLUDED.rating, updated_at = CURRENT_TIMESTAMP`,
        [event.id, visitor.id, rating]
      )
      return { data: { rating } }
    })
  }

  /** Resultado agregado; nunca lista apelidos ou avaliações individuais. */
  async summary({ params }: HttpContext) {
    const event = await Event.findOrFail(params.eventId)
    const rows = await db
      .from('event_evaluations as ee')
      .join('visitors as v', 'v.id', 'ee.visitor_id')
      .where('ee.event_id', event.id)
      .whereNull('ee.deleted_at')
      .whereNull('v.deleted_at')
      .select('ee.rating')
      .count('* as total')
      .groupBy('ee.rating')
    const distribution = Array.from({ length: 5 }, (_, index) => ({
      rating: index + 1,
      total: Number(rows.find((row) => Number(row.rating) === index + 1)?.total ?? 0),
    }))
    const total = distribution.reduce((sum, row) => sum + row.total, 0)
    const average = total
      ? distribution.reduce((sum, row) => sum + row.rating * row.total, 0) / total
      : null
    return { data: { total, average, distribution } }
  }
}
