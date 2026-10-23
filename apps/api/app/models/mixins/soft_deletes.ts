import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import { BaseModel, beforeFetch, beforeFind, beforePaginate } from '@adonisjs/lucid/orm'
import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'

type Query = ModelQueryBuilderContract<LucidModel>

/**
 * Exclusão lógica (regra do projeto: nada é apagado de verdade).
 *
 * Uso: `class Event extends compose(EventSchema, SoftDeletes)`. A tabela
 * precisa da coluna deleted_at. Toda consulta via model ignora excluídos
 * (find, fetch e paginate — este não dispara beforeFetch na contagem).
 * Para restaurar, basta deleted_at = NULL no banco.
 *
 * Consultas que precisam enxergar excluídos (ex.: próximo código
 * sequencial) devem usar o query builder do db, não o model.
 */
export function SoftDeletes<T extends NormalizeConstructor<typeof BaseModel>>(superclass: T) {
  class SoftDeletesModel extends superclass {
    declare deletedAt: DateTime | null

    @beforeFind()
    @beforeFetch()
    static ignoreDeleted(query: Query) {
      query.whereNull(`${query.model.table}.deleted_at`)
    }

    @beforePaginate()
    static ignoreDeletedPaginated([countQuery, fetchQuery]: [Query, Query]) {
      SoftDeletesModel.ignoreDeleted(countQuery)
      SoftDeletesModel.ignoreDeleted(fetchQuery)
    }

    async softDelete() {
      this.deletedAt = DateTime.now()
      await this.save()
    }
  }
  return SoftDeletesModel
}
