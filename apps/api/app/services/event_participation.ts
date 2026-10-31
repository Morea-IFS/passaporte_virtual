import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/** ON CONFLICT respeita o índice parcial e não aborta a transação em leituras simultâneas. */
export async function joinEvent(
  trx: TransactionClientContract,
  visitorId: number,
  eventId: number
) {
  await trx.rawQuery(
    `INSERT INTO event_participations (visitor_id, event_id, created_at, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (visitor_id, event_id) WHERE deleted_at IS NULL DO NOTHING`,
    [visitorId, eventId]
  )
}
