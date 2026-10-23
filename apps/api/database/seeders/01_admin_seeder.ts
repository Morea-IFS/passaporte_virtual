import User from '#models/user'
import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export const DEFAULT_ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? 'admin@passaporte.local',
  fullName: process.env.SEED_ADMIN_NAME ?? 'Administração',
  password: process.env.SEED_ADMIN_PASSWORD ?? 'admin12345',
}

/**
 * Conta padrão do painel /admin. Roda em qualquer ambiente; em produção
 * exige SEED_ADMIN_PASSWORD (a senha padrão só vale fora dela).
 * Não faz nada se a conta já existir.
 */
export default class AdminSeeder extends BaseSeeder {
  async run() {
    if (app.inProduction && !process.env.SEED_ADMIN_PASSWORD) {
      throw new Error('Defina SEED_ADMIN_PASSWORD para criar o administrador em produção')
    }
    if (DEFAULT_ADMIN.password.length < 8) {
      throw new Error('A senha do administrador precisa ter pelo menos 8 caracteres')
    }

    const existing = await User.query({ client: this.client })
      .where('email', DEFAULT_ADMIN.email)
      .first()
    if (existing) return

    await User.create({ ...DEFAULT_ADMIN, isActive: true }, { client: this.client })
    console.log(`Administrador ${DEFAULT_ADMIN.email} criado`)
  }
}
