import Event from '#models/event'
import CheckpointCategory from '#models/checkpoint_category'
import CheckpointCategoryTransformer from '#transformers/checkpoint_category_transformer'
import {
  checkpointCategoryValidator,
  deleteCheckpointCategoryValidator,
} from '#validators/checkpoint_category'
import { PER_PAGE, pageValidator } from '#validators/pagination'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

function withCount(query: ModelQueryBuilderContract<typeof CheckpointCategory>) {
  return query.withCount('checkpoints', (checkpoints) => checkpoints.whereNull('deleted_at'))
}

export default class CheckpointCategoriesController {
  /**
   * Com ?page=N, devolve paginado (tela de categorias). Sem page, a lista
   * completa (seletores de categoria do formulário, filtros e importação).
   */
  async index({ params, request, serialize }: HttpContext) {
    const event = await Event.findOrFail(params.eventId)
    const { page } = await pageValidator.validate(request.qs())
    const query = withCount(CheckpointCategory.query())
      .where('event_id', event.id)
      .orderBy('position', 'asc')
      .orderBy('id', 'asc')

    if (page) {
      const categories = await query.paginate(page, PER_PAGE)
      return serialize(
        CheckpointCategoryTransformer.paginate(categories.all(), categories.getMeta())
      )
    }
    return serialize(CheckpointCategoryTransformer.transform(await query))
  }

  /**
   * Cria a categoria; a cor é escolhida automaticamente (paleta da marca).
   */
  async store({ params, request, response, serialize }: HttpContext) {
    const event = await Event.findOrFail(params.eventId)
    const { name } = await request.validateUsing(checkpointCategoryValidator, {
      meta: { eventId: event.id },
    })

    const category = await CheckpointCategory.createFor(event.id, name)

    response.status(201)
    return serialize(CheckpointCategoryTransformer.transform(category))
  }

  async update({ params, request, serialize }: HttpContext) {
    const category = await CheckpointCategory.findOrFail(params.id)
    const { name } = await request.validateUsing(checkpointCategoryValidator, {
      meta: { eventId: category.eventId, categoryId: category.id },
    })

    await category.merge({ name }).save()

    const updated = await withCount(CheckpointCategory.query())
      .where('id', category.id)
      .firstOrFail()
    return serialize(CheckpointCategoryTransformer.transform(updated))
  }

  /**
   * Exclusão lógica. Se a categoria tiver pontos, eles precisam ir para
   * outra categoria do mesmo evento (moveToCategoryId); sem isso, é bloqueada
   * para nenhum ponto ficar sem categoria.
   */
  async destroy({ params, request, response }: HttpContext) {
    const category = await withCount(CheckpointCategory.query())
      .where('id', params.id)
      .firstOrFail()
    const inUse = Number(category.$extras.checkpoints_count ?? 0)
    const { moveToCategoryId } = await request.validateUsing(deleteCheckpointCategoryValidator, {
      meta: { eventId: category.eventId, categoryId: category.id },
    })

    if (inUse > 0 && !moveToCategoryId) {
      return response.unprocessableEntity({
        errors: [
          {
            message:
              inUse === 1
                ? 'Não dá para excluir: 1 ponto ainda usa esta categoria.'
                : `Não dá para excluir: ${inUse} pontos ainda usam esta categoria.`,
          },
        ],
      })
    }

    await db.transaction(async (trx) => {
      if (moveToCategoryId) {
        // Inclui pontos já excluídos: se forem restaurados, não ficam
        // apontando para uma categoria excluída.
        await trx
          .from('checkpoints')
          .where('category_id', category.id)
          .update({ category_id: moveToCategoryId, updated_at: new Date() })
      }
      category.useTransaction(trx)
      await category.softDelete()
    })

    return response.noContent()
  }
}
