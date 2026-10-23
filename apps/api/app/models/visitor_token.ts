import { VisitorTokenSchema } from '#database/schema'
import Visitor from '#models/visitor'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { createHash, randomBytes } from 'node:crypto'

/**
 * Token de um dispositivo do visitante. Só o hash fica no banco; o valor
 * vai uma única vez para o navegador (cookie httpOnly no web).
 */
export default class VisitorToken extends VisitorTokenSchema {
  @belongsTo(() => Visitor)
  declare visitor: BelongsTo<typeof Visitor>

  static hash(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  /** Cria um token novo para o visitante e devolve o valor em texto */
  static async issue(visitor: Visitor) {
    const token = randomBytes(32).toString('base64url')
    await VisitorToken.create(
      { visitorId: visitor.id, tokenHash: VisitorToken.hash(token) },
      { client: visitor.$trx }
    )
    return token
  }
}
