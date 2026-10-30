import { api, ApiValidationError, VisitorUnauthorizedError } from '@/lib/api'
import { offlineHeaders, offlineScope, sameOriginRequest } from '@/lib/offline-session'
import { visitorSession } from '@/lib/session'

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) {
    return Response.json({ error: 'Origem inválida.' }, { status: 403, headers: offlineHeaders })
  }
  const token = await visitorSession.get()
  if (!token) return Response.json({}, { status: 401, headers: offlineHeaders })
  const body = await request.json().catch(() => null)
  if (!body || !/^[A-Za-z0-9_-]{1,64}$/.test(body.qrToken ?? '')) {
    return Response.json({ error: 'QR code inválido.' }, { status: 400, headers: offlineHeaders })
  }
  if (body.scope !== offlineScope(token)) {
    return Response.json(
      { error: 'O passaporte deste celular mudou.' },
      { status: 409, headers: offlineHeaders }
    )
  }
  try {
    return Response.json({ result: await api.checkIn(body.qrToken) }, { headers: offlineHeaders })
  } catch (error) {
    if (error instanceof VisitorUnauthorizedError) {
      return Response.json({}, { status: 401, headers: offlineHeaders })
    }
    if (error instanceof ApiValidationError) {
      return Response.json({ error: error.message }, { status: 422, headers: offlineHeaders })
    }
    // Next's public-checkpoint 404 is translated without leaking framework control-flow details.
    const digest =
      error && typeof error === 'object' && 'digest' in error ? String(error.digest) : ''
    if (digest === 'NEXT_HTTP_ERROR_FALLBACK;404') {
      return Response.json(
        { error: 'Este QR code não foi encontrado.' },
        { status: 404, headers: offlineHeaders }
      )
    }
    return Response.json(
      { error: 'Não foi possível sincronizar agora.' },
      { status: 503, headers: offlineHeaders }
    )
  }
}
