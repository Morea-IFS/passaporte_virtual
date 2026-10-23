import Checkin from '#models/checkin'
import Checkpoint from '#models/checkpoint'
import { passportProgress } from '#services/passport'
import { checkinValidator } from '#validators/visitor'
import type { HttpContext } from '@adonisjs/core/http'

export default class CheckinsController {
  /**
   * Carimba o ponto lido pelo QR (RF11). Ler de novo não duplica (RF15):
   * devolve o carimbo existente com alreadyCheckedIn = true.
   */
  async store({ request, response, visitor }: HttpContext) {
    const { qrToken } = await request.validateUsing(checkinValidator)
    const checkpoint = await Checkpoint.query()
      .where('qr_token', qrToken)
      .whereHas('event', (event) => event.whereNull('deleted_at'))
      .preload('event')
      .preload('category')
      .firstOrFail()

    let checkin = await Checkin.query()
      .where('visitor_id', visitor.id)
      .where('checkpoint_id', checkpoint.id)
      .first()
    const alreadyCheckedIn = Boolean(checkin)

    if (!checkin) {
      // RN04: desativado não aceita carimbo novo
      if (!checkpoint.isActive) {
        return response.unprocessableEntity({
          errors: [{ message: 'Este ponto não está recebendo carimbos agora.' }],
        })
      }
      try {
        checkin = await Checkin.create({
          visitorId: visitor.id,
          checkpointId: checkpoint.id,
          eventId: checkpoint.eventId,
        })
      } catch {
        // Duas leituras ao mesmo tempo: o índice único segurou a segunda
        checkin = await Checkin.query()
          .where('visitor_id', visitor.id)
          .where('checkpoint_id', checkpoint.id)
          .firstOrFail()
      }
    }

    return {
      data: {
        alreadyCheckedIn,
        checkedInAt: checkin.createdAt.toISO(),
        nickname: visitor.nickname,
        progress: await passportProgress(checkpoint.event, visitor.id),
        event: { slug: checkpoint.event.slug, name: checkpoint.event.name },
      },
    }
  }
}
