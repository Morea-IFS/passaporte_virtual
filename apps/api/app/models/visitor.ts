import { VisitorSchema } from '#database/schema'
import Checkin from '#models/checkin'
import VisitorToken from '#models/visitor_token'
import { SoftDeletes } from '#models/mixins/soft_deletes'
import { compose } from '@adonisjs/core/helpers'
import encryption from '@adonisjs/core/services/encryption'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { randomInt } from 'node:crypto'

/** Sem letras/números que se confundem (0/O, 1/I/L) */
const RECOVERY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Visitante do passaporte: só um apelido (RF19). Identificado no
 * dispositivo por um token (VisitorToken) e recuperável em outro celular
 * com apelido + código de recuperação (RF21).
 */
export default class Visitor extends compose(VisitorSchema, SoftDeletes) {
  @hasMany(() => VisitorToken)
  declare tokens: HasMany<typeof VisitorToken>

  @hasMany(() => Checkin)
  declare checkins: HasMany<typeof Checkin>

  get recoveryCode() {
    return encryption.decrypt<string>(this.recoveryCodeEncrypted) ?? ''
  }

  set recoveryCode(code: string) {
    this.recoveryCodeEncrypted = encryption.encrypt(code)
  }

  /** Ex.: K7Q2-MX9A */
  static generateRecoveryCode() {
    const pick = () =>
      Array.from({ length: 4 }, () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)]).join(
        ''
      )
    return `${pick()}-${pick()}`
  }

  /** Normaliza o que a pessoa digitou (maiúsculas, sem espaços, com hífen) */
  static normalizeRecoveryCode(code: string) {
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
    return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
  }

  static findByNickname(nickname: string) {
    return Visitor.query().whereRaw('lower(nickname) = lower(?)', [nickname]).first()
  }
}
