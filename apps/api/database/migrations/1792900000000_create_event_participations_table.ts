import { BaseSchema } from '@adonisjs/lucid/schema'

/** Um passaporte por evento, inclusive quando o visitante ainda não carimbou. */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('event_participations', (table) => {
      table.increments('id').notNullable()
      table.integer('visitor_id').unsigned().notNullable().references('id').inTable('visitors')
      table.integer('event_id').unsigned().notNullable().references('id').inTable('events')
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.index(['event_id', 'visitor_id'])
    })
    this.schema.raw(
      'CREATE UNIQUE INDEX event_participations_active_unique ON event_participations (visitor_id, event_id) WHERE deleted_at IS NULL'
    )
    // Preserva a data do primeiro carimbo nos passaportes já existentes.
    this.schema.raw(`
      INSERT INTO event_participations (visitor_id, event_id, created_at, updated_at)
      SELECT ci.visitor_id, ci.event_id, MIN(ci.created_at), MIN(ci.created_at)
      FROM checkins ci
      JOIN visitors v ON v.id = ci.visitor_id AND v.deleted_at IS NULL
      JOIN events e ON e.id = ci.event_id AND e.deleted_at IS NULL
      WHERE ci.deleted_at IS NULL
      GROUP BY ci.visitor_id, ci.event_id
    `)
    this.schema.raw(
      'CREATE INDEX checkins_event_live_idx ON checkins (event_id, checkpoint_id, visitor_id) WHERE deleted_at IS NULL'
    )
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS checkins_event_live_idx')
    this.schema.dropTable('event_participations')
  }
}
