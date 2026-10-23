import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Visitantes (RF18–RF21): só apelido. O dispositivo guarda um token cujo
 * hash fica em visitor_tokens (um visitante pode ter vários celulares).
 * Check-ins (RF11/RF15): no máximo um por visitante e ponto.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('visitors', (table) => {
      table.increments('id').notNullable()
      table.string('nickname', 20).notNullable()
      // Código de recuperação criptografado com APP_KEY (precisa ser exibido de novo)
      table.text('recovery_code_encrypted').notNullable()
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
    // Apelido único no sistema todo, sem diferenciar maiúsculas, entre não excluídos
    this.schema.raw(
      'CREATE UNIQUE INDEX visitors_nickname_active_unique ON visitors (lower(nickname)) WHERE deleted_at IS NULL'
    )

    this.schema.createTable('visitor_tokens', (table) => {
      table.increments('id').notNullable()
      table
        .integer('visitor_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('visitors')
        .onDelete('CASCADE')
      table.string('token_hash', 64).notNullable().unique()
      table.timestamp('last_used_at').nullable()
      table.timestamp('created_at').notNullable()
    })

    this.schema.createTable('checkins', (table) => {
      table.increments('id').notNullable()
      table
        .integer('visitor_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('visitors')
        .onDelete('CASCADE')
      table
        .integer('checkpoint_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('checkpoints')
        .onDelete('CASCADE')
      table
        .integer('event_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['visitor_id', 'event_id'])
    })
    this.schema.raw(
      'CREATE UNIQUE INDEX checkins_visitor_checkpoint_active_unique ON checkins (visitor_id, checkpoint_id) WHERE deleted_at IS NULL'
    )
  }

  async down() {
    this.schema.dropTable('checkins')
    this.schema.dropTable('visitor_tokens')
    this.schema.dropTable('visitors')
  }
}
