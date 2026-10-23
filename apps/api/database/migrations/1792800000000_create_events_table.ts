import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 160).notNullable()
      table.string('slug', 80).notNullable().unique()
      table.date('starts_on').notNullable()
      table.date('ends_on').notNullable()
      table.string('location', 200).nullable()
      table.string('hashtag', 80).nullable()
      table.text('description').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
