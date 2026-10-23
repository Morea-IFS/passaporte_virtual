import type { NextRequest } from 'next/server'
import { api } from '@/lib/api'
import { parseId } from '@/lib/params'

/**
 * Baixa o PDF de QR codes gerado pela API, repassando os parâmetros
 * (layout, ids, includeInactive) e o nome do arquivo.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<'/admin/eventos/[eventId]/qrcodes/pdf'>
) {
  const eventId = parseId((await params).eventId)
  const query = request.nextUrl.searchParams
  const response = await api.qrCodesPdf(eventId, {
    layout: query.get('layout') ?? 'cartaz',
    ids: query.get('ids') ?? undefined,
    includeInactive: query.get('includeInactive') === 'on' ? 'true' : undefined,
  })

  return new Response(response.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        response.headers.get('Content-Disposition') ?? 'attachment; filename="qrcodes.pdf"',
    },
  })
}
