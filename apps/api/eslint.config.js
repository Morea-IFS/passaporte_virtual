import { configApp } from '@adonisjs/eslint-config'

export default configApp({
  // Gerado pelo Lucid a cada migration
  ignores: ['database/schema.ts'],
})
