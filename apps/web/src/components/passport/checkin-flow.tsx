'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { checkIn, type CheckinState } from '@/app/passaporte/actions'
import { NicknameForm } from '@/components/passport/nickname-form'
import { ProgressBar } from '@/components/passport/progress-bar'
import { RecoveryCode } from '@/components/passport/recovery-code'
import { Stamp } from '@/components/passport/stamp'
import { buttonClass } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Notice } from '@/components/ui/feedback'

type CheckinFlowProps = {
  qrToken: string
  code: string
  categoryName: string
  color: string
  /** Este celular já tem passaporte (cookie) */
  hasPassport: boolean
}

/**
 * Carimbo automático ao abrir o QR (RF11). Roda no navegador depois que a
 * página aparece (nunca na renderização), então pré-carregamento de link
 * não carimba por engano.
 */
export function CheckinFlow({ qrToken, code, categoryName, color, hasPassport }: CheckinFlowProps) {
  const [state, setState] = useState<CheckinState>(hasPassport ? {} : { needsPassport: true })
  const [pending, startTransition] = useTransition()
  // Só carimba sozinho se o celular já tinha passaporte ao abrir a página.
  // Criar o passaporte grava o cookie e a página é atualizada com
  // hasPassport = true; sem esta trava, carimbaria de novo por cima.
  const started = useRef(!hasPassport)

  useEffect(() => {
    if (started.current) return
    started.current = true
    startTransition(async () => setState(await checkIn(qrToken)))
  }, [qrToken])

  const onStarted = useCallback((next: CheckinState) => setState(next), [])

  if (state.needsPassport) {
    return (
      <Panel>
        <NicknameForm start={{ qrToken }} returnTo={`/c/${qrToken}`} onDone={onStarted} />
      </Panel>
    )
  }

  if (state.error) return <Notice tone="neutral">{state.error}</Notice>

  if (pending || !state.result) {
    return (
      <Panel className="items-center py-8">
        <span className="size-24 animate-pulse rounded-full border-4 border-dashed border-line" />
        <p className="font-display font-bold text-muted">Carimbando...</p>
      </Panel>
    )
  }

  const { result, recoveryCode } = state
  return (
    <Panel className="items-center gap-4 text-center">
      <Stamp
        code={code}
        categoryName={categoryName}
        color={color}
        date={result.checkedInAt}
        label={`Carimbo de ${categoryName}`}
        className="size-36"
        animate={!result.alreadyCheckedIn}
      />
      <div className="flex flex-col gap-1">
        <p className="font-display text-2xl font-black text-accent">
          {result.alreadyCheckedIn ? 'Você já tinha carimbado aqui' : 'Carimbado!'}
        </p>
        <p className="text-[15px] text-muted">
          {result.alreadyCheckedIn
            ? 'Esse carimbo continua no seu passaporte.'
            : `Boa, ${result.nickname}! Mais um no seu passaporte.`}
        </p>
      </div>
      <div className="w-full text-left">
        <ProgressBar progress={result.progress} caption="pontos visitados" />
      </div>

      {recoveryCode ? <RecoveryCode code={recoveryCode} nickname={result.nickname} /> : null}

      <Link
        href={`/passaporte/${result.event.slug}`}
        className={buttonClass('primary', { block: true })}
      >
        Ver meu passaporte
      </Link>
    </Panel>
  )
}
