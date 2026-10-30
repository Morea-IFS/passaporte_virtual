import { api } from '@/lib/api'
import { parseId } from '@/lib/params'

export async function GET(
  _request: Request,
  { params }: RouteContext<'/admin/eventos/[eventId]/dados/csv'>
) {
  const eventId = parseId((await params).eventId)
  const response = await api.eventAnalyticsCsv(eventId)
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition':
        response.headers.get('Content-Disposition') ??
        `attachment; filename="indicadores-${eventId}.csv"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
