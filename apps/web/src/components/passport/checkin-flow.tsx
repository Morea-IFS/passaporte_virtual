'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { checkIn, type CheckinState } from '@/app/passaporte/actions'
import { NicknameForm } from '@/components/passport/nickname-form'
import { ProgressBar } from '@/components/passport/progress-bar'
import { RecoveryCode } from '@/components/passport/recovery-code'
import { ShareCheckin } from '@/components/passport/share-checkin'
import { Stamp } from '@/components/passport/stamp'
import { buttonClass } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Notice } from '@/components/ui/feedback'
import type { CheckinResult } from '@/lib/types'
import {
  CHANGE_EVENT,
  RESULT_EVENT,
  enqueueCheckin,
  readOffline,
  refreshOfflineSession,
  retryCheckins,
  syncCheckins,
  type OfflineEntry,
} from '../../../public/offline-store.mjs'

function rememberDeviceSession() {
  try {
    void refreshOfflineSession(localStorage).catch(() => {})
  } catch {
    /* Storage is optional online. */
  }
}

type CheckinFlowProps = {
  qrToken: string
  code: string
  categoryName: string
  color: string
  checkpointName: string
  eventName: string
  hashtag: string | null
  /** Este celular já tem passaporte (cookie) */
  hasPassport: boolean
}

/** Carimba depois de abrir o QR, nunca na renderização ou no prefetch. */
export function CheckinFlow({
  qrToken,
  code,
  categoryName,
  color,
  hasPassport,
  checkpointName,
  eventName,
  hashtag,
}: CheckinFlowProps) {
  const [state, setState] = useState<CheckinState>(hasPassport ? {} : { needsPassport: true })
  const [queued, setQueued] = useState<OfflineEntry | null>(null)
  const [pending, startTransition] = useTransition()
  const started = useRef(!hasPassport)
  const queuedForScope = useRef<string | null>(null)

  const queueVisit = useCallback(() => {
    try {
      const { scope } = readOffline(localStorage)
      queuedForScope.current = scope
      setQueued(enqueueCheckin(localStorage, scope, qrToken))
      setState({})
    } catch {
      setState({
        error:
          'Não foi possível guardar esta visita. Conecte-se e tente novamente para confirmar o carimbo.',
      })
    }
  }, [qrToken])

  const stamp = useCallback(() => {
    if (!navigator.onLine) {
      queueVisit()
      return
    }
    startTransition(async () => {
      try {
        const next = await checkIn(qrToken)
        setState(next)
        if (next.result) {
          setQueued(null)
          // Saves only an opaque comparison scope. The httpOnly cookie remains unreadable.
          rememberDeviceSession()
        }
      } catch {
        // A lost response may already have created the stamp; server idempotency handles replay.
        queueVisit()
      }
    })
  }, [qrToken, queueVisit])

  useEffect(() => {
    const read = () => {
      try {
        const offline = readOffline(localStorage)
        if (queuedForScope.current && queuedForScope.current !== offline.scope) {
          queuedForScope.current = null
          setState({
            error:
              'O passaporte deste celular mudou. Abra o QR novamente com conexão para registrar sua visita.',
          })
        }
        setQueued(offline.entries.find((entry) => entry.qrToken === qrToken) ?? null)
      } catch {
        /* Storage not available. */
      }
    }
    const confirmed = (event: Event) => {
      const detail = (event as CustomEvent<{ qrToken: string; result: CheckinResult }>).detail
      if (detail.qrToken === qrToken) {
        setState({ result: detail.result })
        setQueued(null)
      }
    }
    window.addEventListener(CHANGE_EVENT, read)
    window.addEventListener(RESULT_EVENT, confirmed)
    window.addEventListener('storage', read)
    return () => {
      window.removeEventListener(CHANGE_EVENT, read)
      window.removeEventListener(RESULT_EVENT, confirmed)
      window.removeEventListener('storage', read)
    }
  }, [qrToken])

  useEffect(() => {
    if (started.current) return
    started.current = true
    stamp()
  }, [stamp])

  const onStarted = useCallback((next: CheckinState) => {
    setState(next)
    if (next.result) rememberDeviceSession()
  }, [])

  if (state.needsPassport) {
    return (
      <Panel>
        <NicknameForm start={{ qrToken }} returnTo={`/c/${qrToken}`} onDone={onStarted} />
      </Panel>
    )
  }

  if (state.error) {
    return (
      <Panel>
        <Notice tone="neutral">{state.error}</Notice>
        <button type="button" className={buttonClass('ghost', { block: true })} onClick={stamp}>
          Tentar novamente
        </button>
      </Panel>
    )
  }

  if (queued && !state.result) {
    return (
      <Panel>
        <Notice
          tone={
            queued.status === 'error' ? 'error' : queued.status === 'synced' ? 'success' : 'neutral'
          }
        >
          {queued.status === 'synced'
            ? 'Sincronizado: carimbo confirmado.'
            : queued.status === 'error'
              ? 'Não foi possível confirmar este carimbo.'
              : 'Visita guardada neste celular. O carimbo está pendente de confirmação.'}
        </Notice>
        <p className="text-[15px] text-muted">
          {queued.message ||
            'Mantenha o app aberto. Quando a conexão voltar, o servidor verificará o ponto e confirmará seu carimbo.'}
        </p>
        <button
          type="button"
          className={buttonClass('ghost', { block: true })}
          onClick={() => {
            retryCheckins(localStorage)
            startTransition(async () => {
              try {
                await syncCheckins(localStorage)
                stamp()
              } catch {
                queueVisit()
              }
            })
          }}
          disabled={pending}
        >
          {pending ? 'Verificando…' : 'Tentar sincronizar novamente'}
        </button>
        {/* Full document navigation is necessary for the service worker's independent offline shell. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={buttonClass('ghost', { block: true })}>
          Voltar ao passaporte
        </a>
      </Panel>
    )
  }

  if (pending || !state.result) {
    return (
      <Panel className="items-center py-8">
        <span className="size-24 animate-pulse rounded-full border-4 border-dashed border-line" />
        <p role="status" className="font-display font-bold text-muted">
          Carimbando...
        </p>
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
      <ShareCheckin
        checkpointName={checkpointName}
        eventName={eventName}
        hashtag={hashtag}
        categoryName={categoryName}
        color={color}
      />
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
