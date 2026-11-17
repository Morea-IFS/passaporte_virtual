'use server'

import { redirect } from 'next/navigation'
import { api, ApiValidationError, VisitorUnauthorizedError } from '@/lib/api'
import { visitorSession } from '@/lib/session'
import { safePath } from '@/lib/url'
import type { CheckinResult, FormState } from '@/lib/types'

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export type CheckinState = {
  result?: CheckinResult
  /** Celular sem passaporte: mostrar o formulário de apelido */
  needsPassport?: boolean
  /** Código mostrado logo após criar o passaporte */
  recoveryCode?: string
  error?: string
}

export async function checkNickname(nickname: string) {
  try {
    const { available } = await api.nicknameAvailable(nickname)
    return { available }
  } catch (error) {
    if (error instanceof ApiValidationError) return { available: false, error: error.message }
    throw error
  }
}

/** Carimba o ponto (RF11). Sem passaporte no celular, pede o apelido. */
export async function checkIn(qrToken: string, visitorToken?: string): Promise<CheckinState> {
  try {
    return { result: await api.checkIn(qrToken, visitorToken) }
  } catch (error) {
    if (error instanceof VisitorUnauthorizedError) {
      await visitorSession.clear()
      return { needsPassport: true }
    }
    if (error instanceof ApiValidationError) return { error: error.message }
    throw error
  }
}

/** Onde o passaporte foi criado: num QR de estande ou ao escolher o evento na home */
export type PassportStart = { qrToken: string } | { eventSlug: string }

/**
 * Cria o passaporte com o apelido (RF19). Vindo de um QR de estande, já
 * carimba; vindo da escolha do evento, abre o passaporte com o código em destaque.
 */
export async function startPassport(
  start: PassportStart,
  _: CheckinState & FormState,
  formData: FormData
): Promise<CheckinState & FormState> {
  const nickname = text(formData, 'nickname')
  let account
  try {
    account = await api.registerVisitor(
      nickname,
      'eventSlug' in start ? start.eventSlug : undefined
    )
  } catch (error) {
    if (error instanceof ApiValidationError) {
      return {
        needsPassport: true,
        error: error.fieldErrors.nickname ?? error.message,
        values: { nickname },
      }
    }
    throw error
  }
  await visitorSession.set(account.token)

  if ('eventSlug' in start) {
    redirect(`/passaporte/${encodeURIComponent(start.eventSlug)}?bemvindo=1`)
  }
  // O cookie recém-gravado só vale na próxima requisição: usa o token direto
  const checkin = await checkIn(start.qrToken, account.token)
  return { ...checkin, recoveryCode: account.recoveryCode }
}

/** Abre o passaporte em outro celular com apelido + código (RF21) */
export async function recoverPassport(
  returnTo: string,
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const nickname = text(formData, 'nickname')
  try {
    const account = await api.recoverVisitor(nickname, text(formData, 'code'))
    await visitorSession.set(account.token)
  } catch (error) {
    if (error instanceof ApiValidationError) {
      return { error: error.message, values: { nickname } }
    }
    throw error
  }
  redirect(safePath(returnTo))
}

/** Sai do passaporte neste navegador. */
export async function leavePassport() {
  try {
    await api.visitorLogout()
  } catch (error) {
    if (!(error instanceof VisitorUnauthorizedError)) throw error
  }
  await visitorSession.clear()
  redirect('/')
}

/** Registra a entrada em outro evento sem exigir outro apelido. */
export async function joinPassport(slug: string) {
  try {
    await api.joinEvent(slug)
    return { success: true }
  } catch {
    return {
      error:
        'Não foi possível registrar sua entrada no evento. Tente novamente quando estiver conectado.',
    }
  }
}

export async function evaluateEvent(
  slug: string,
  _: FormState & { rating?: number },
  formData: FormData
): Promise<FormState & { rating?: number }> {
  try {
    const { rating } = await api.evaluate(slug, Number(formData.get('rating')))
    return { rating }
  } catch (error) {
    if (error instanceof ApiValidationError) return { error: error.message }
    if (error instanceof VisitorUnauthorizedError)
      return { error: 'Recupere seu passaporte para enviar a avaliação.' }
    return { error: 'Não foi possível enviar. Confira sua conexão e tente novamente.' }
  }
}
