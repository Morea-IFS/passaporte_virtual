import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Categorias de ponto passam a ser cadastradas por evento (antes eram uma
 * lista fixa no código). Eventos existentes recebem as 5 categorias antigas
 * e os pontos são ligados a elas pelo nome.
 */
const DEFAULTS = [
  { key: 'pesquisa', name: 'Pesquisa', color: 'azul' },
  { key: 'oficina', name: 'Oficina', color: 'laranja' },
  { key: 'apresentacao', name: 'Apresentação', color: 'magenta' },
  { key: 'cultural', name: 'Cultural', color: 'verde' },
  { key: 'curso', name: 'Curso', color: 'turquesa' },
]

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('checkpoint_categories', (table) => {
      table.increments('id').notNullable()
      table
        .integer('event_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
      table.string('name', 40).notNullable()
      table.string('color', 20).notNullable()
      table.integer('position').notNullable().defaultTo(0)
      table.timestamp('deleted_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['event_id', 'position'])
    })
    // Nome único dentro do evento (sem diferenciar maiúsculas), só entre não excluídas
    this.schema.raw(
      'CREATE UNIQUE INDEX checkpoint_categories_event_name_active_unique ON checkpoint_categories (event_id, lower(name)) WHERE deleted_at IS NULL'
    )

    this.schema.alterTable('checkpoints', (table) => {
      table
        .integer('category_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('checkpoint_categories')
    })

    this.defer(async (db) => {
      const events = await db.from('events').select('id')
      for (const event of events) {
        for (const [position, category] of DEFAULTS.entries()) {
          const [{ id }] = await db
            .table('checkpoint_categories')
            .insert({
              event_id: event.id,
              name: category.name,
              color: category.color,
              position,
              created_at: new Date(),
              updated_at: new Date(),
            })
            .returning('id')
          await db
            .from('checkpoints')
            .where('event_id', event.id)
            .where('category', category.key)
            .update({ category_id: id })
        }
      }
    })

    this.schema.alterTable('checkpoints', (table) => {
      table.dropIndex(['event_id', 'category'])
      table.dropColumn('category')
      table.index(['event_id', 'category_id'])
    })
    this.schema.raw('ALTER TABLE checkpoints ALTER COLUMN category_id SET NOT NULL')
  }

  async down() {
    this.schema.alterTable('checkpoints', (table) => {
      table.string('category', 20).nullable()
    })
    this.defer(async (db) => {
      for (const category of DEFAULTS) {
        await db.rawQuery(
          `UPDATE checkpoints SET category = ? FROM checkpoint_categories c
           WHERE c.id = checkpoints.category_id AND c.name = ?`,
          [category.key, category.name]
        )
      }
      await db.from('checkpoints').whereNull('category').update({ category: 'pesquisa' })
    })
    this.schema.alterTable('checkpoints', (table) => {
      table.dropIndex(['event_id', 'category_id'])
      table.dropForeign(['category_id'])
      table.dropColumn('category_id')
      table.index(['event_id', 'category'])
    })
    this.schema.raw('ALTER TABLE checkpoints ALTER COLUMN category SET NOT NULL')
    this.schema.dropTable('checkpoint_categories')
  }
}
