import Event from '#models/event'
import { audit } from '#services/audit'
import { analyticsCsv, eventAnalytics } from '#services/event_analytics'
import { pageValidator } from '#validators/pagination'
import type { HttpContext } from '@adonisjs/core/http'

export default class EventAnalyticsController {
  async show({ params, request }: HttpContext) {
    const event = await Event.findOrFail(params.eventId)
    const { page = 1 } = await pageValidator.validate(request.qs())
    return { data: await eventAnalytics(event, page) }
  }

  async export({ params, auth, response }: HttpContext) {
    const event = await Event.findOrFail(params.eventId)
    const data = await eventAnalytics(event)
    await audit(auth.getUserOrFail(), {
      action: 'download',
      resourceType: 'file',
      resourceId: event.id,
      resourceName: 'Indicadores do evento (CSV)',
      eventId: event.id,
      details: {
        format: 'csv',
        participants: data.summary.participants,
        checkins: data.summary.totalCheckins,
      },
    })
    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', `attachment; filename="indicadores-${event.id}.csv"`)
    response.header('Cache-Control', 'private, no-store')
    response.header('X-Content-Type-Options', 'nosniff')
    return response.send(analyticsCsv(data))
  }
}
