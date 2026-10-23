import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Exclusão lógica: registros excluídos ganham deleted_at e continuam no banco,
 * para poderem ser restaurados manualmente (deleted_at = NULL).
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('events', (table) => {
      table.timestamp('deleted_at').nullable()
      table.dropUnique(['slug'])
    })
    // Endereço único só entre eventos não excluídos
    this.schema.raw(
      'CREATE UNIQUE INDEX events_slug_active_unique ON events (slug) WHERE deleted_at IS NULL'
    )

    this.schema.alterTable('checkpoints', (table) => {
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS events_slug_active_unique')
    this.schema.alterTable('events', (table) => {
      table.dropColumn('deleted_at')
      table.unique(['slug'])
    })
    this.schema.alterTable('checkpoints', (table) => {
      table.dropColumn('deleted_at')
    })
  }
}
