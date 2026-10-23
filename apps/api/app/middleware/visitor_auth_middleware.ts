import type Visitor from '#models/visitor'
import VisitorToken from '#models/visitor_token'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

/**
 * Identifica o visitante pelo header X-Visitor-Token (enviado pelo
 * servidor do web, que guarda o token num cookie httpOnly).
 */
export default class VisitorAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const token = ctx.request.header('x-visitor-token')
    const record = token
      ? await VisitorToken.query()
          .where('token_hash', VisitorToken.hash(token))
          .preload('visitor')
          .first()
      : null

    if (!record?.visitor) {
      return ctx.response.unauthorized({
        errors: [{ message: 'Passaporte não encontrado neste dispositivo.' }],
      })
    }

    // Atualiza "último uso" no máximo uma vez por hora
    if (!record.lastUsedAt || record.lastUsedAt < DateTime.now().minus({ hours: 1 })) {
      await record.merge({ lastUsedAt: DateTime.now() }).save()
    }

    ctx.visitor = record.visitor
    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    visitor: Visitor
  }
}
