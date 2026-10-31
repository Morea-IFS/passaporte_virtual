import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('events', (table) => {
      table.string('evaluation_mode', 16).notNullable().defaultTo('integrated')
      table.text('evaluation_url').nullable()
    })
    this.schema.createTable('event_evaluations', (table) => {
      table.increments('id')
      table.integer('event_id').unsigned().notNullable().references('id').inTable('events')
      table.integer('visitor_id').unsigned().notNullable().references('id').inTable('visitors')
      table.integer('rating').notNullable()
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
    this.schema.raw(
      'ALTER TABLE event_evaluations ADD CONSTRAINT evaluation_rating_range CHECK (rating BETWEEN 1 AND 5)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX event_evaluations_active_unique ON event_evaluations (visitor_id, event_id) WHERE deleted_at IS NULL'
    )
    this.schema.raw(
      'CREATE INDEX event_evaluations_event_active ON event_evaluations (event_id) WHERE deleted_at IS NULL'
    )
  }

  async down() {
    this.schema.dropTable('event_evaluations')
    this.schema.alterTable('events', (table) => {
      table.dropColumns('evaluation_mode', 'evaluation_url')
    })
  }
}
