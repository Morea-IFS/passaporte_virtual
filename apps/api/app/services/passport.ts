import Checkin from '#models/checkin'
import Checkpoint from '#models/checkpoint'
import CheckpointCategory from '#models/checkpoint_category'
import type Event from '#models/event'

/**
 * Passaporte de um evento: pontos (ativos, mais os já carimbados mesmo que
 * desativados depois — RN04), categorias e progresso. Sem visitante,
 * é a lista pública do evento (RF14).
 */
export async function buildPassport(event: Event, visitorId: number | null) {
  const checkins = visitorId
    ? await Checkin.query()
        .where('visitor_id', visitorId)
        .where('event_id', event.id)
        .whereHas('checkpoint', (checkpoint) => checkpoint.whereNull('deleted_at'))
    : []
  const visitedAt = new Map(checkins.map((checkin) => [checkin.checkpointId, checkin.createdAt]))

  const checkpoints = await Checkpoint.query()
    .where('event_id', event.id)
    .where((query) => {
      query.where('is_active', true).orWhereIn('id', [...visitedAt.keys()])
    })
    .preload('category')
    .orderBy('code', 'asc')

  const categories = await CheckpointCategory.query()
    .where('event_id', event.id)
    .orderBy('position', 'asc')
    .orderBy('id', 'asc')

  return {
    event: {
      name: event.name,
      slug: event.slug,
      hashtag: event.hashtag,
      location: event.location,
      startsOn: event.startsOn.toISODate(),
      endsOn: event.endsOn.toISODate(),
    },
    progress: { visited: visitedAt.size, total: checkpoints.length },
    categories: categories.map(({ id, name, color }) => ({ id, name, color })),
    checkpoints: checkpoints.map((checkpoint) => ({
      code: checkpoint.code,
      qrToken: checkpoint.qrToken,
      name: checkpoint.name,
      location: checkpoint.location,
      imageUrl: checkpoint.imageUrl,
      logoUrl: checkpoint.logoUrl,
      isActive: checkpoint.isActive,
      categoryId: checkpoint.categoryId,
      category: { name: checkpoint.category.name, color: checkpoint.category.color },
      visitedAt: visitedAt.get(checkpoint.id)?.toISO() ?? null,
    })),
  }
}

/** Progresso do visitante no evento (para a tela do carimbo) */
export async function passportProgress(event: Event, visitorId: number) {
  const { progress } = await buildPassport(event, visitorId)
  return progress
}
