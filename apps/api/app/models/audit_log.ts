import { AuditLogSchema } from '#database/schema'

/** Registro append-only: não há rotas de edição ou exclusão. */
export default class AuditLog extends AuditLogSchema {}
