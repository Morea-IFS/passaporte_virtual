import Checkin from '#models/checkin'
import Checkpoint from '#models/checkpoint'
import Event from '#models/event'
import { joinEvent } from '#services/event_participation'
import { passportProgress } from '#services/passport'
import { checkinValidator } from '#validators/visitor'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class CheckinsController {
  /** O carimbo e a inscrição são atômicos; repetir o QR não duplica nenhum deles. */
  async store({ request, response, visitor }: HttpContext) {
    const { qrToken } = await request.validateUsing(checkinValidator)
    const result = await db.transaction(async (trx) => {
      // Mesma ordem de bloqueio da exclusão administrativa: evento antes do ponto.
      const event = await Event.query({ client: trx })
        .whereHas('checkpoints', (query) =>
          query.where('qr_token', qrToken).whereNull('deleted_at')
        )
        .forShare()
        .firstOrFail()
      const checkpoint = await Checkpoint.query({ client: trx })
        .where('qr_token', qrToken)
        .where('event_id', event.id)
        .forShare()
        .firstOrFail()
      let checkin = await Checkin.query({ client: trx })
        .where('visitor_id', visitor.id)
        .where('checkpoint_id', checkpoint.id)
        .first()
      let alreadyCheckedIn = Boolean(checkin)
      if (!checkin) {
        if (!checkpoint.isActive) return null
        const inserted = await trx.rawQuery(
          `INSERT INTO checkins (visitor_id, checkpoint_id, event_id, created_at, updated_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (visitor_id, checkpoint_id) WHERE deleted_at IS NULL DO NOTHING
           RETURNING id`,
          [visitor.id, checkpoint.id, checkpoint.eventId]
        )
        alreadyCheckedIn = inserted.rows.length === 0
        checkin = await Checkin.query({ client: trx })
          .where('visitor_id', visitor.id)
          .where('checkpoint_id', checkpoint.id)
          .firstOrFail()
      }
      await joinEvent(trx, visitor.id, event.id)
      return { event, checkin, alreadyCheckedIn }
    })
    if (!result) {
      return response.unprocessableEntity({
        errors: [{ message: 'Este ponto não está recebendo carimbos agora.' }],
      })
    }
    return {
      data: {
        alreadyCheckedIn: result.alreadyCheckedIn,
        checkedInAt: result.checkin.createdAt.toISO(),
        nickname: visitor.nickname,
        progress: await passportProgress(result.event, visitor.id),
        event: { slug: result.event.slug, name: result.event.name },
      },
    }
  }
}
