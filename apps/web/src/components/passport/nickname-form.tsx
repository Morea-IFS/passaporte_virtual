'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  checkNickname,
  startPassport,
  type CheckinState,
  type PassportStart,
} from '@/app/passaporte/actions'
import { TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import type { FormState } from '@/lib/types'

/**
 * Cria o passaporte: escolhe um apelido (verifica a disponibilidade
 * enquanto a pessoa digita). Num QR de estande, já carimba.
 */
export function NicknameForm({
  start,
  returnTo,
  onDone,
}: {
  start: PassportStart
  /** Volta para cá depois de "Já tenho passaporte" */
  returnTo: string
  onDone?: (state: CheckinState) => void
}) {
  const [state, action] = useActionState(
    startPassport.bind(null, start),
    {} as CheckinState & FormState
  )
  const stamps = 'qrToken' in start
  const [nickname, setNickname] = useState(state.values?.nickname ?? '')
  const [availability, setAvailability] = useState<{
    value: string
    message?: string
    ok: boolean
  }>()

  // Passaporte criado: segue para o carimbo (ou para o aviso, se o ponto não aceitar)
  useEffect(() => {
    if (state.result || (state.error && !state.needsPassport)) onDone?.(state)
  }, [state, onDone])

  // Verifica o apelido 400 ms depois que a pessoa para de digitar
  useEffect(() => {
    const value = nickname.trim()
    if (value.length < 3) return
    const timer = setTimeout(async () => {
      const { available, error } = await checkNickname(value)
      setAvailability({
        value,
        ok: available,
        message:
          error ?? (available ? 'Disponível ✓' : 'Esse apelido já está em uso. Tente outro.'),
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [nickname])

  const current = availability?.value === nickname.trim() ? availability : undefined

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold">Comece seu passaporte</h2>
        <p className="text-[15px] text-muted">
          Escolha um apelido. É só isso: sem e-mail e sem senha.
        </p>
      </div>
      <TextField
        name="nickname"
        label="Apelido"
        required
        minLength={3}
        maxLength={20}
        autoComplete="nickname"
        autoCapitalize="none"
        placeholder="ex.: ana.estrela"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        error={state.error ?? (current && !current.ok ? current.message : undefined)}
        hint={current?.ok ? current.message : 'Letras sem acento, números, ponto, hífen ou _.'}
      />
      <SubmitButton pendingLabel={stamps ? 'Carimbando...' : 'Criando...'} block>
        {stamps ? 'Começar e carimbar' : 'Criar meu passaporte'}
      </SubmitButton>
      <Link
        href={`/recuperar?voltar=${encodeURIComponent(returnTo)}`}
        className="flex min-h-11 items-center self-center font-display text-[14px] font-bold text-accent underline underline-offset-4"
      >
        Já tenho passaporte
      </Link>
      <p className="text-[13px] text-muted">
        Seu apelido e a quantidade de carimbos podem aparecer no ranking.{' '}
        <Link
          href="/privacidade"
          className="inline-flex min-h-11 items-center text-accent underline"
        >
          Como usamos seus dados
        </Link>
      </p>
    </form>
  )
}
