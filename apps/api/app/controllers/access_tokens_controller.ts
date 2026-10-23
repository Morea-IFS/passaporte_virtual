import User from '#models/user'
import { audit } from '#services/audit'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import { errors } from '@adonisjs/auth'

export default class AccessTokensController {
  async store({ request, response, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    let user: User
    try {
      user = await User.verifyCredentials(email, password)
    } catch (error) {
      if (error instanceof errors.E_INVALID_CREDENTIALS) {
        await audit(
          { email },
          {
            action: 'login_failed',
            resourceType: 'session',
            details: { motivo: 'e-mail ou senha incorretos' },
          }
        )
      }
      throw error
    }
    if (!user.isActive || user.deletedAt) {
      await audit(user, {
        action: 'login_failed',
        resourceType: 'session',
        details: { motivo: user.deletedAt ? 'conta removida' : 'conta desativada' },
      })
      return response.badRequest({ errors: [{ message: 'Credenciais inválidas.' }] })
    }
    const token = await User.accessTokens.create(user)
    await audit(user, { action: 'login', resourceType: 'session' })

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }

  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }
    await audit(user, { action: 'logout', resourceType: 'session' })

    return {
      message: 'Logged out successfully',
    }
  }
}
