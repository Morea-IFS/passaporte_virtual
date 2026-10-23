import 'server-only'
import { cookies } from 'next/headers'

const DAY = 60 * 60 * 24

/**
 * Sessão guardada num cookie httpOnly (o JavaScript da página não lê).
 */
function cookieSession(name: string, maxAge: number) {
  return {
    name,
    async get() {
      return (await cookies()).get(name)?.value
    },
    async set(token: string) {
      ;(await cookies()).set(name, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge,
      })
    },
    async clear() {
      ;(await cookies()).delete(name)
    },
  }
}

/** Organizador (painel): 30 dias */
export const adminSession = cookieSession('pv_admin_token', 30 * DAY)

/** Visitante (passaporte): 1 ano, para o celular continuar reconhecido (RF20) */
export const visitorSession = cookieSession('pv_visitor', 365 * DAY)
