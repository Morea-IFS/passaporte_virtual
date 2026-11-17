import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('checkpoints', (table) => {
      table.text('team_info').nullable()
    })
  }

  async down() {
    this.schema.alterTable('checkpoints', (table) => {
      table.dropColumn('team_info')
    })
  }
}
