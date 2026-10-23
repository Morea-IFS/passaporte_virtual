import Checkpoint from '#models/checkpoint'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Página pública aberta pelo QR code. Sem login: busca pelo token
 * aleatório do ponto (não dá para adivinhar a partir do código CP-xxx).
 */
export default class PublicCheckpointsController {
  async show({ params, serialize }: HttpContext) {
    const checkpoint = await Checkpoint.query()
      .where('qr_token', params.token)
      // Subconsultas de relação não passam pelos hooks do model: filtra à mão
      .whereHas('event', (event) => event.whereNull('deleted_at'))
      .preload('category')
      .preload('event')
      .firstOrFail()

    const { event, category } = checkpoint
    return serialize({
      name: checkpoint.name,
      code: checkpoint.code,
      summary: checkpoint.summary,
      location: checkpoint.location,
      imageUrl: checkpoint.imageUrl,
      logoUrl: checkpoint.logoUrl,
      isActive: checkpoint.isActive,
      category: { name: category.name, color: category.color },
      event: {
        name: event.name,
        slug: event.slug,
        hashtag: event.hashtag,
        startsOn: event.startsOn.toISODate(),
        endsOn: event.endsOn.toISODate(),
        location: event.location,
      },
    })
  }
}
