import Visitor from '#models/visitor'
import VisitorToken from '#models/visitor_token'
import {
  nicknameAvailabilityValidator,
  recoverVisitorValidator,
  registerVisitorValidator,
} from '#validators/visitor'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { timingSafeEqual } from 'node:crypto'

function sameCode(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/**
 * Identificação do visitante (RF18–RF21): só apelido, token por dispositivo
 * e código de recuperação. Sem e-mail e sem senha.
 */
export default class VisitorsController {
  async availability({ request }: HttpContext) {
    const { nickname } = await nicknameAvailabilityValidator.validate(request.qs())
    return { data: { nickname, available: !(await Visitor.findByNickname(nickname)) } }
  }

  async register({ request, response }: HttpContext) {
    const { nickname } = await request.validateUsing(registerVisitorValidator)

    const result = await db.transaction(async (trx) => {
      const visitor = new Visitor()
      visitor.useTransaction(trx)
      visitor.nickname = nickname
      visitor.recoveryCode = Visitor.generateRecoveryCode()
      await visitor.save()
      const token = await VisitorToken.issue(visitor)
      return { token, visitor }
    })

    response.status(201)
    return {
      data: {
        token: result.token,
        nickname: result.visitor.nickname,
        recoveryCode: result.visitor.recoveryCode,
      },
    }
  }

  /** Outro celular: apelido + código de recuperação criam um token novo */
  async recover({ request, response }: HttpContext) {
    const { nickname, code } = await request.validateUsing(recoverVisitorValidator)
    const visitor = await Visitor.findByNickname(nickname)

    if (!visitor || !sameCode(visitor.recoveryCode, Visitor.normalizeRecoveryCode(code))) {
      return response.badRequest({
        errors: [{ message: 'Apelido ou código de recuperação incorretos.' }],
      })
    }

    const token = await VisitorToken.issue(visitor)
    return { data: { token, nickname: visitor.nickname, recoveryCode: visitor.recoveryCode } }
  }

  async me({ visitor }: HttpContext) {
    return { data: { nickname: visitor.nickname, recoveryCode: visitor.recoveryCode } }
  }

  /** Sai deste dispositivo (apaga só o token dele; o passaporte continua) */
  async logout({ request, response }: HttpContext) {
    const token = request.header('x-visitor-token')!
    await VisitorToken.query().where('token_hash', VisitorToken.hash(token)).delete()
    return response.noContent()
  }
}
