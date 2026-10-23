import 'server-only'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'pv_admin_token'
const THIRTY_DAYS = 60 * 60 * 24 * 30

export async function getToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value
}

export async function setToken(token: string) {
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: THIRTY_DAYS,
  })
}

export async function clearToken() {
  ;(await cookies()).delete(SESSION_COOKIE)
}
