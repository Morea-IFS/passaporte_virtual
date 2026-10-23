import Visitor from '#models/visitor'
import { participantFiltersValidator } from '#validators/audit'
import { PER_PAGE } from '#validators/pagination'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

type CheckinRow = {
  visitor_id: number
  event_id: number
  event_name: string
  event_slug: string
  checkpoint_id: number
  created_at: Date | string
}

type VisitedRow = {
  id: number
  event_id: number
  event_name: string
  checkpoint_code: string
  checkpoint_name: string
  created_at: Date | string
}

type CheckpointRow = { id: number; event_id: number; is_active: boolean }

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

async function participation(visitorIds: number[]) {
  if (visitorIds.length === 0) return new Map<number, ReturnType<typeof makeSummary>>()
  const checkins = (await db
    .from('checkins as ci')
    .join('events as e', 'e.id', 'ci.event_id')
    .join('checkpoints as cp', 'cp.id', 'ci.checkpoint_id')
    .whereIn('ci.visitor_id', visitorIds)
    .whereNull('ci.deleted_at')
    .whereNull('e.deleted_at')
    .whereNull('cp.deleted_at')
    .select(
      'ci.visitor_id',
      'ci.event_id',
      'e.name as event_name',
      'e.slug as event_slug',
      'ci.checkpoint_id',
      'ci.created_at'
    )) as CheckinRow[]
  const eventIds = [...new Set(checkins.map((row) => row.event_id))]
  const checkpoints = eventIds.length
    ? ((await db
        .from('checkpoints')
        .whereIn('event_id', eventIds)
        .whereNull('deleted_at')
        .select('id', 'event_id', 'is_active')) as CheckpointRow[])
    : []
  const byVisitor = new Map<number, ReturnType<typeof makeSummary>>()
  for (const visitorId of visitorIds) byVisitor.set(visitorId, makeSummary())
  for (const row of checkins) {
    const summary = byVisitor.get(row.visitor_id)!
    let event = summary.events.get(row.event_id)
    if (!event) {
      event = {
        id: row.event_id,
        name: row.event_name,
        slug: row.event_slug,
        visited: new Set<number>(),
      }
      summary.events.set(row.event_id, event)
    }
    event.visited.add(row.checkpoint_id)
    summary.totalCheckins++
    const timestamp = iso(row.created_at)
    if (!summary.lastActivity || timestamp > summary.lastActivity) summary.lastActivity = timestamp
  }
  for (const summary of byVisitor.values()) {
    for (const event of summary.events.values()) {
      event.total = checkpoints.filter(
        (cp) => cp.event_id === event.id && (cp.is_active || event.visited.has(cp.id))
      ).length
    }
  }
  return byVisitor
}

function makeSummary() {
  return {
    totalCheckins: 0,
    lastActivity: null as string | null,
    events: new Map<
      number,
      {
        id: number
        name: string
        slug: string
        visited: Set<number>
        total?: number
      }
    >(),
  }
}

function output(visitor: Visitor, summary: ReturnType<typeof makeSummary>) {
  return {
    id: visitor.id,
    nickname: visitor.nickname,
    totalCheckins: summary.totalCheckins,
    lastActivity: summary.lastActivity,
    createdAt: visitor.createdAt,
    events: [...summary.events.values()].map((event) => ({
      id: event.id,
      name: event.name,
      slug: event.slug,
      visited: event.visited.size,
      total: event.total ?? 0,
    })),
  }
}

export default class ParticipantsController {
  async index({ request }: HttpContext) {
    const { q, eventId, page = 1 } = await participantFiltersValidator.validate(request.qs())
    const visitors = await Visitor.query()
      .if(q, (query) => query.whereILike('nickname', `%${q}%`))
      .if(eventId, (query) =>
        query.whereHas('checkins', (checkins) => checkins.where('event_id', eventId!))
      )
      .orderBy('nickname', 'asc')
      .paginate(page, PER_PAGE)
    const summaries = await participation(visitors.all().map(({ id }) => id))
    return {
      data: visitors.all().map((visitor) => output(visitor, summaries.get(visitor.id)!)),
      metadata: visitors.getMeta(),
    }
  }

  async show({ params, serialize }: HttpContext) {
    const visitor = await Visitor.findOrFail(params.id)
    const summaries = await participation([visitor.id])
    return serialize(output(visitor, summaries.get(visitor.id)!))
  }

  /** Pontos visitados pelo participante, do mais recente ao mais antigo */
  async checkins({ params, request }: HttpContext) {
    const visitor = await Visitor.findOrFail(params.id)
    const { eventId, page = 1 } = await participantFiltersValidator.validate(request.qs())
    const checkins = await db
      .from('checkins as ci')
      .join('events as e', 'e.id', 'ci.event_id')
      .join('checkpoints as cp', 'cp.id', 'ci.checkpoint_id')
      .where('ci.visitor_id', visitor.id)
      .if(eventId, (query) => query.where('ci.event_id', eventId!))
      .whereNull('ci.deleted_at')
      .whereNull('e.deleted_at')
      .whereNull('cp.deleted_at')
      .select(
        'ci.id',
        'ci.event_id',
        'e.name as event_name',
        'cp.code as checkpoint_code',
        'cp.name as checkpoint_name',
        'ci.created_at'
      )
      .orderBy('ci.created_at', 'desc')
      .orderBy('ci.id', 'desc')
      .paginate(page, PER_PAGE)
    return {
      data: (checkins.all() as VisitedRow[]).map((row) => ({
        id: row.id,
        eventId: row.event_id,
        eventName: row.event_name,
        code: row.checkpoint_code,
        name: row.checkpoint_name,
        visitedAt: iso(row.created_at),
      })),
      metadata: checkins.getMeta(),
    }
  }
}
