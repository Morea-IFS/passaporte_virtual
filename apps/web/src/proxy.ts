import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'pv_admin_token'

/**
 * Checagem otimista: sem cookie de sessão, a área do organizador
 * manda para o login. A API valida o token de verdade em cada chamada.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = pathname === '/admin/login' || pathname === '/admin/sair'

  if (!isPublic && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
