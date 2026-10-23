import Event from '#models/event'
import Checkpoint from '#models/checkpoint'
import { buildEntrancePdf, buildQrCodesPdf } from '#services/qr_codes_pdf'
import { audit } from '#services/audit'
import env from '#start/env'
import { qrCodesExportValidator } from '#validators/checkpoint'
import type { HttpContext } from '@adonisjs/core/http'

export default class QrCodesController {
  /**
   * PDF para imprimir os QR codes do evento (RF08/RF09).
   * ?layout=cartaz|etiquetas|entrada, ?ids=1,2 (opcional) e ?includeInactive=true.
   * "entrada" é o cartaz da recepção (abre o site; não é ponto).
   */
  async show({ auth, params, request, response }: HttpContext) {
    const event = await Event.findOrFail(params.eventId)
    const { layout, ids, includeInactive } = await qrCodesExportValidator.validate(request.qs())

    if (layout === 'entrada') {
      const pdf = await buildEntrancePdf(event, `${env.get('PUBLIC_WEB_URL').replace(/\/$/, '')}/`)
      await audit(auth.getUserOrFail(), {
        action: 'download',
        resourceType: 'event',
        resourceId: event.id,
        resourceName: event.name,
        eventId: event.id,
        details: { arquivo: 'PDF de QR code', formato: 'entrada' },
      })
      return this.sendPdf(response, pdf, `qrcode-entrada-${event.slug}.pdf`)
    }

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
    await audit(auth.getUserOrFail(), {
      action: 'download',
      resourceType: 'event',
      resourceId: event.id,
      resourceName: event.name,
      eventId: event.id,
      details: {
        arquivo: 'PDF de QR codes',
        formato: layout,
        pontos: checkpoints.map((checkpoint) => checkpoint.code).join(', '),
      },
    })
    const suffix = checkpoints.length === 1 ? checkpoints[0].code.toLowerCase() : layout
    return this.sendPdf(response, pdf, `qrcodes-${event.slug}-${suffix}.pdf`)
  }

  private sendPdf(response: HttpContext['response'], pdf: Buffer, filename: string) {
    response.header('Content-Type', 'application/pdf')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    return response.send(pdf)
  }
}
