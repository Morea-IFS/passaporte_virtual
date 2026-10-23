import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

/**
 * Sessão expirada ou inválida: apaga o cookie e volta ao login.
 * (Server Components não podem alterar cookies, por isso uma rota.)
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url))
  response.cookies.delete(SESSION_COOKIE)
  return response
}
