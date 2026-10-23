import Checkin from '#models/checkin'
import Event from '#models/event'
import { buildPassport } from '#services/passport'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

const EVENT_TIMEZONE = 'America/Sao_Paulo'

/**
 * Eventos para o visitante escolher: os que estão acontecendo ou vão
 * acontecer primeiro (por data de início), depois os encerrados.
 */
async function listPublicEvents() {
  const today = DateTime.now().setZone(EVENT_TIMEZONE).toISODate()!
  const events = await Event.query().withCount('checkpoints', (checkpoints) =>
    checkpoints.whereNull('deleted_at').where('is_active', true)
  )
  return events
    .map((event) => ({
      name: event.name,
      slug: event.slug,
      hashtag: event.hashtag,
      location: event.location,
      startsOn: event.startsOn.toISODate()!,
      endsOn: event.endsOn.toISODate()!,
      checkpointsCount: Number(event.$extras.checkpoints_count ?? 0),
      ended: event.endsOn.toISODate()! < today,
    }))
    .sort((a, b) =>
      a.ended !== b.ended
        ? Number(a.ended) - Number(b.ended)
        : a.ended
          ? b.startsOn.localeCompare(a.startsOn)
          : a.startsOn.localeCompare(b.startsOn)
    )
}

export default class PassportsController {
  /** Passaporte do visitante no evento (RF13, RF14, RF16) */
  async show({ params, visitor }: HttpContext) {
    const event = await Event.query().where('slug', params.slug).firstOrFail()
    return { data: { nickname: visitor.nickname, ...(await buildPassport(event, visitor.id)) } }
  }

  /** Eventos disponíveis (home do passaporte) */
  async indexPublic() {
    return { data: await listPublicEvents() }
  }

  /** Progresso do visitante em cada evento em que já carimbou algo */
  async index({ visitor }: HttpContext) {
    const rows: { event_id: number; visited: string }[] = await Checkin.query()
      .where('visitor_id', visitor.id)
      .whereHas('checkpoint', (checkpoint) => checkpoint.whereNull('deleted_at'))
      .groupBy('event_id')
      .select('event_id')
      .count('* as visited')
      .pojo()
    const visitedByEvent = new Map(rows.map((row) => [row.event_id, Number(row.visited)]))
    const events = await Event.query().whereIn('id', [...visitedByEvent.keys()])
    return {
      data: {
        nickname: visitor.nickname,
        passports: events.map((event) => ({
          slug: event.slug,
          visited: visitedByEvent.get(event.id) ?? 0,
        })),
      },
    }
  }

  /** Lista pública do evento, para quem ainda não tem passaporte (RF14) */
  async showPublic({ params }: HttpContext) {
    const event = await Event.query().where('slug', params.slug).firstOrFail()
    return { data: await buildPassport(event, null) }
  }
}
