import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class CreateOrganizer extends BaseCommand {
  static commandName = 'organizer:create'
  static description = 'Cria uma conta de organizador para a área administrativa'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'E-mail do organizador' })
  declare email?: string

  @flags.string({ description: 'Nome do organizador' })
  declare name?: string

  @flags.string({ description: 'Senha (mínimo 8 caracteres)' })
  declare password?: string

  async run() {
    const { default: User } = await import('#models/user')

    const email = this.email ?? (await this.prompt.ask('E-mail'))
    const fullName = this.name ?? (await this.prompt.ask('Nome'))
    const password =
      this.password ??
      (await this.prompt.secure('Senha (mínimo 8 caracteres)', {
        validate: (value) => value.length >= 8 || 'A senha precisa ter pelo menos 8 caracteres',
      }))

    if (!password || password.length < 8) {
      this.logger.error('A senha precisa ter pelo menos 8 caracteres')
      this.exitCode = 1
      return
    }

    if (await User.findBy('email', email)) {
      this.logger.error(`Já existe um organizador com o e-mail ${email}`)
      this.exitCode = 1
      return
    }

    await User.create({ email, fullName, password })
    this.logger.success(`Organizador ${email} criado`)
  }
}
