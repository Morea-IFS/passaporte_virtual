import type Event from '#models/event'
import { PER_PAGE } from '#validators/pagination'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export const EVENT_TIMEZONE = 'America/Sao_Paulo'

/** Todas as métricas usam os mesmos registros vivos e o mesmo denominador do passaporte. */
const population = `
  WITH relevant_checkpoints AS (
    SELECT id, code, name, category_id, is_active FROM checkpoints
    WHERE event_id = ? AND deleted_at IS NULL
  ), live_checkins AS (
    SELECT ci.visitor_id, ci.checkpoint_id, ci.created_at
    FROM checkins ci
    JOIN relevant_checkpoints cp ON cp.id = ci.checkpoint_id
    JOIN visitors v ON v.id = ci.visitor_id AND v.deleted_at IS NULL
    WHERE ci.event_id = ? AND ci.deleted_at IS NULL
  ), participant_ids AS (
    SELECT ep.visitor_id FROM event_participations ep
    JOIN visitors v ON v.id = ep.visitor_id AND v.deleted_at IS NULL
    WHERE ep.event_id = ? AND ep.deleted_at IS NULL
    UNION SELECT visitor_id FROM live_checkins
  ), progress AS (
    SELECT p.visitor_id, v.nickname, COUNT(DISTINCT ci.checkpoint_id)::int AS visited,
      ((SELECT COUNT(*) FROM relevant_checkpoints WHERE is_active) +
        COUNT(DISTINCT ci.checkpoint_id) FILTER (WHERE NOT cp.is_active))::int AS total
    FROM participant_ids p
    JOIN visitors v ON v.id = p.visitor_id
    LEFT JOIN live_checkins ci ON ci.visitor_id = p.visitor_id
    LEFT JOIN relevant_checkpoints cp ON cp.id = ci.checkpoint_id
    GROUP BY p.visitor_id, v.nickname
  ), ranked AS (
    SELECT *, RANK() OVER (ORDER BY visited DESC)::int AS position FROM progress
  )
`

type Client = typeof db | TransactionClientContract

async function rows<T>(
  client: Client,
  eventId: number,
  sql: string,
  bindings: (string | number)[] = []
) {
  const result = await client.rawQuery(`${population} ${sql}`, [
    eventId,
    eventId,
    eventId,
    ...bindings,
  ])
  return result.rows as T[]
}

export type RankingEntry = { nickname: string; visited: number; total: number; position: number }

async function ranking(client: Client, eventId: number, page: number) {
  const data = await rows<RankingEntry>(
    client,
    eventId,
    `SELECT nickname, visited, total, position FROM ranked
       ORDER BY visited DESC, lower(nickname), visitor_id LIMIT ? OFFSET ?`,
    [PER_PAGE, (page - 1) * PER_PAGE]
  )
  const totals = await rows<{ total: number }>(
    client,
    eventId,
    'SELECT COUNT(*)::int AS total FROM progress'
  )
  const total = Number(totals[0].total)
  return {
    data,
    metadata: {
      total,
      perPage: PER_PAGE,
      currentPage: page,
      lastPage: Math.max(1, Math.ceil(total / PER_PAGE)),
    },
  }
}

export async function eventRanking(event: Event, page = 1) {
  return db.transaction(async (trx) => ({
    event: { name: event.name, slug: event.slug },
    ranking: await ranking(trx, event.id, page),
  }))
}

export async function eventAnalytics(event: Event, page = 1) {
  return db.transaction(async (trx) => {
    const summaries = await rows<{
      participants: number
      visitorsWithCheckins: number
      totalCheckins: number
      averageVisited: number
      completedPassports: number
      activeCheckpoints: number
    }>(
      trx,
      event.id,
      `
        SELECT COUNT(*)::int AS participants,
          COUNT(*) FILTER (WHERE visited > 0)::int AS "visitorsWithCheckins",
          COALESCE(SUM(visited), 0)::int AS "totalCheckins",
          COALESCE(ROUND(AVG(visited), 2), 0)::float AS "averageVisited",
          COUNT(*) FILTER (WHERE total > 0 AND visited >= total)::int AS "completedPassports",
          (SELECT COUNT(*)::int FROM relevant_checkpoints WHERE is_active) AS "activeCheckpoints"
        FROM progress`
    )
    const checkpoints = await rows<{
      id: number
      code: string
      name: string
      isActive: boolean
      visits: number
    }>(
      trx,
      event.id,
      `
        SELECT cp.id, cp.code, cp.name, cp.is_active AS "isActive", COUNT(ci.visitor_id)::int AS visits
        FROM relevant_checkpoints cp LEFT JOIN live_checkins ci ON ci.checkpoint_id = cp.id
        GROUP BY cp.id, cp.code, cp.name, cp.is_active
        ORDER BY visits DESC, cp.code`
    )
    const categories = await rows<{ id: number; name: string; color: string; visits: number }>(
      trx,
      event.id,
      `
        SELECT cat.id, cat.name, cat.color, COUNT(ci.visitor_id)::int AS visits
        FROM checkpoint_categories cat
        LEFT JOIN relevant_checkpoints cp ON cp.category_id = cat.id
        LEFT JOIN live_checkins ci ON ci.checkpoint_id = cp.id
        WHERE cat.event_id = ? AND cat.deleted_at IS NULL
        GROUP BY cat.id, cat.name, cat.color, cat.position
        ORDER BY cat.position, cat.id`,
      [event.id]
    )
    const daily = await rows<{ date: string; visits: number }>(
      trx,
      event.id,
      `
        SELECT to_char(created_at AT TIME ZONE ?, 'YYYY-MM-DD') AS date,
          COUNT(*)::int AS visits FROM live_checkins GROUP BY date ORDER BY date`,
      [EVENT_TIMEZONE]
    )
    const hourlyRows = await rows<{ hour: number; visits: number }>(
      trx,
      event.id,
      `
        SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE ?)::int AS hour,
          COUNT(*)::int AS visits FROM live_checkins GROUP BY hour ORDER BY hour`,
      [EVENT_TIMEZONE]
    )
    const progressRows = await rows<{ bucket: number; count: number }>(
      trx,
      event.id,
      `
        SELECT CASE WHEN visited = 0 THEN 0 WHEN total > 0 AND visited >= total THEN 4
          WHEN visited::float / NULLIF(total, 0) < 0.25 THEN 1
          WHEN visited::float / NULLIF(total, 0) < 0.75 THEN 2 ELSE 3 END AS bucket,
          COUNT(*)::int AS count FROM progress GROUP BY bucket ORDER BY bucket`
    )
    const leaders = await ranking(trx, event.id, page)
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      visits: hourlyRows.find((row) => row.hour === hour)?.visits ?? 0,
    }))
    const labels = ['Sem carimbos', 'Abaixo de 25%', '25% a 74%', '75% a 99%', 'Completo']
    return {
      event: { id: event.id, name: event.name, slug: event.slug },
      timezone: EVENT_TIMEZONE,
      generatedAt: new Date().toISOString(),
      summary: summaries[0],
      checkpoints,
      categories,
      daily,
      hourly,
      progress: labels.map((label, bucket) => ({
        label,
        count: progressRows.find((row) => row.bucket === bucket)?.count ?? 0,
      })),
      ranking: leaders,
    }
  })
}

/** Neutraliza fórmulas mesmo quando precedidas por espaços ou caracteres de controle. */
export function csvCell(value: string | number) {
  let cell = String(value)
  let firstContent = 0
  while (
    firstContent < cell.length &&
    (cell.charCodeAt(firstContent) < 33 || /\s/u.test(cell[firstContent]))
  ) {
    firstContent++
  }
  if (
    typeof value === 'string' &&
    ('=+@-'.includes(cell[firstContent] ?? '\0') || ['\t', '\r', '\n'].includes(cell[0]))
  ) {
    cell = `'${cell}`
  }
  return `"${cell.replaceAll('"', '""')}"`
}

export function analyticsCsv(data: Awaited<ReturnType<typeof eventAnalytics>>) {
  const output: (string | number)[][] = [
    ['seção', 'identificador', 'nome', 'valor'],
    ['evento', data.event.id, data.event.name, data.event.slug],
    ['metadados', 'fuso', 'Fuso horário', data.timezone],
    ['metadados', 'gerado_em', 'Gerado em (UTC)', data.generatedAt],
    ['resumo', 'participantes', 'Passaportes criados', data.summary.participants],
    [
      'resumo',
      'visitantes_com_carimbos',
      'Visitantes com carimbos',
      data.summary.visitorsWithCheckins,
    ],
    ['resumo', 'checkins', 'Check-ins válidos', data.summary.totalCheckins],
    ['resumo', 'media', 'Média de pontos por participante', data.summary.averageVisited],
    ['resumo', 'completos', 'Passaportes completos', data.summary.completedPassports],
    ['resumo', 'ativos', 'Pontos ativos', data.summary.activeCheckpoints],
    ...data.checkpoints.map((cp) => ['ponto', cp.code, cp.name, cp.visits]),
    ...data.categories.map((category) => [
      'categoria',
      category.id,
      category.name,
      category.visits,
    ]),
    ...data.daily.map((day) => ['dia', day.date, day.date, day.visits]),
    ...data.hourly.map((hour) => [
      'hora',
      hour.hour,
      `${String(hour.hour).padStart(2, '0')}h`,
      hour.visits,
    ]),
    ...data.progress.map((bucket, index) => ['progresso', index, bucket.label, bucket.count]),
  ]
  return `\uFEFF${output.map((row) => row.map(csvCell).join(';')).join('\r\n')}\r\n`
}
