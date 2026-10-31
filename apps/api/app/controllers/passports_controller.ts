import Checkin from '#models/checkin'
import Event from '#models/event'
import { buildPassport } from '#services/passport'
import { joinEvent } from '#services/event_participation'
import { eventRanking } from '#services/event_analytics'
import { pageValidator } from '#validators/pagination'
import db from '@adonisjs/lucid/services/db'
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

  /** Uma inscrição explícita evita mutações em GETs e conta quem ainda não carimbou. */
  async join({ params, visitor }: HttpContext) {
    const slug = await db.transaction(async (trx) => {
      const event = await Event.query({ client: trx })
        .where('slug', params.slug)
        .forShare()
        .firstOrFail()
      await joinEvent(trx, visitor.id, event.id)
      return event.slug
    })
    return { data: { slug } }
  }

  /** Ranking público usa somente apelidos e contagens, sem identificadores internos. */
  async ranking({ params, request }: HttpContext) {
    const event = await Event.query().where('slug', params.slug).firstOrFail()
    const { page = 1 } = await pageValidator.validate(request.qs())
    return { data: await eventRanking(event, page) }
  }

  /** Inclui passaportes com zero carimbos e preserva compatibilidade com carimbos legados. */
  async index({ visitor }: HttpContext) {
    const rows: { event_id: number; visited: string }[] = await Checkin.query()
      .where('visitor_id', visitor.id)
      .whereHas('checkpoint', (checkpoint) => checkpoint.whereNull('deleted_at'))
      .groupBy('event_id')
      .select('event_id')
      .count('* as visited')
      .pojo()
    const enrolled: { event_id: number }[] = await db
      .from('event_participations')
      .where('visitor_id', visitor.id)
      .whereNull('deleted_at')
      .select('event_id')
    const visitedByEvent = new Map(rows.map((row) => [row.event_id, Number(row.visited)]))
    const eventIds = [
      ...new Set([...visitedByEvent.keys(), ...enrolled.map((row) => row.event_id)]),
    ]
    const events = await Event.query().whereIn('id', eventIds)
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
