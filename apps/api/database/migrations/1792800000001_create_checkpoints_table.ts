import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'checkpoints'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('event_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
      table.string('code', 12).notNullable()
      table.string('qr_token', 32).notNullable().unique()
      table.string('name', 160).notNullable()
      table.string('category', 20).notNullable()
      table.text('summary').nullable()
      table.string('location', 160).nullable()
      table.string('image_path').nullable()
      table.string('logo_path').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['event_id', 'code'])
      table.index(['event_id', 'category'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
