import { BaseSchema } from '@adonisjs/lucid/schema'

/** Administração e auditoria (RF28–RF31). */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('deleted_at').nullable()
    })

    this.schema.createTable('audit_logs', (table) => {
      table.increments('id').notNullable()
      table
        .integer('actor_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('actor_name', 160).nullable()
      table.string('actor_email', 254).notNullable()
      table.string('action', 80).notNullable()
      table.string('resource_type', 80).notNullable()
      table.string('resource_id', 80).nullable()
      table.string('resource_name', 200).nullable()
      table
        .integer('event_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('events')
        .onDelete('SET NULL')
      table.jsonb('details').notNullable().defaultTo('{}')
      table.timestamp('created_at').notNullable()

      table.index('created_at')
      table.index('actor_user_id')
      table.index('action')
      table.index('resource_type')
      table.index('event_id')
    })

    this.schema.alterTable('checkins', (table) => {
      table.index(['event_id', 'visitor_id', 'created_at'])
    })
  }

  async down() {
    this.schema.alterTable('checkins', (table) => {
      table.dropIndex(['event_id', 'visitor_id', 'created_at'])
    })
    this.schema.dropTable('audit_logs')
    this.schema.alterTable('users', (table) => {
      table.dropColumn('deleted_at')
      table.dropColumn('is_active')
    })
  }
}
