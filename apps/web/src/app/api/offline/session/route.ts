import { api, VisitorUnauthorizedError } from '@/lib/api'
import { offlineHeaders, offlineScope } from '@/lib/offline-session'
import { visitorSession } from '@/lib/session'

export async function GET() {
  const token = await visitorSession.get()
  if (!token) return Response.json({}, { status: 401, headers: offlineHeaders })
  try {
    await api.visitorMe()
    return Response.json({ scope: offlineScope(token) }, { headers: offlineHeaders })
  } catch (error) {
    return Response.json(
      {},
      {
        status: error instanceof VisitorUnauthorizedError ? 401 : 503,
        headers: offlineHeaders,
      }
    )
  }
}
