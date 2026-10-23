import Event from '#models/event'
import Checkpoint from '#models/checkpoint'
import { buildQrCodesPdf } from '#services/qr_codes_pdf'
import { qrCodesExportValidator } from '#validators/checkpoint'
import type { HttpContext } from '@adonisjs/core/http'

export default class QrCodesController {
  /**
   * PDF para imprimir os QR codes do evento (RF08/RF09).
   * ?layout=cartaz|etiquetas, ?ids=1,2 (opcional) e ?includeInactive=true.
   */
  async show({ params, request, response }: HttpContext) {
    const event = await Event.findOrFail(params.eventId)
    const { layout, ids, includeInactive } = await qrCodesExportValidator.validate(request.qs())

    const checkpoints = await Checkpoint.query()
      .where('event_id', event.id)
      .if(ids, (query) => query.whereIn('id', ids!.split(',').map(Number)))
      .if(!includeInactive, (query) => query.where('is_active', true))
      .preload('category')
      .orderBy('code', 'asc')

    if (checkpoints.length === 0) {
      return response.unprocessableEntity({
        errors: [{ message: 'Nenhum ponto para gerar QR code com essas opções.' }],
      })
    }

    const pdf = await buildQrCodesPdf(event, checkpoints, layout)
    const suffix = checkpoints.length === 1 ? checkpoints[0].code.toLowerCase() : layout
    response.header('Content-Type', 'application/pdf')
    response.header(
      'Content-Disposition',
      `attachment; filename="qrcodes-${event.slug}-${suffix}.pdf"`
    )
    return response.send(pdf)
  }
}
