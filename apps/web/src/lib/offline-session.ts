import 'server-only'
import { createHash } from 'node:crypto'

/** A comparison handle only: this hash cannot authorize API requests. */
export function offlineScope(token: string) {
  return createHash('sha256').update(`pv-offline:${token}`).digest('hex')
}

export function sameOriginRequest(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin || request.headers.get('sec-fetch-site') === 'cross-site') return false
  // Next may construct request.url with its internal bind hostname. Compare the public Host.
  const url = new URL(request.url)
  const host = request.headers.get('host') ?? url.host
  const protocol =
    request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ?? url.protocol.slice(0, -1)
  if (protocol !== 'http' && protocol !== 'https') return false
  try {
    return new URL(origin).origin === new URL(`${protocol}://${host}`).origin
  } catch {
    return false
  }
}

export const offlineHeaders = { 'Cache-Control': 'no-store, private', 'Vary': 'Cookie' }
