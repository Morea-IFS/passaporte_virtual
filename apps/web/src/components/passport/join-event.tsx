'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { joinPassport } from '@/app/passaporte/actions'
import { Notice } from '@/components/ui/feedback'
import { buttonClass } from '@/components/ui/button'

/** Registra a escolha do evento via POST; GET/pré-carregamento nunca inscreve. */
export function JoinEvent({ slug }: { slug: string }) {
  const started = useRef(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const join = () => startTransition(async () => setError((await joinPassport(slug)).error))
  useEffect(() => {
    if (started.current) return
    started.current = true
    startTransition(async () => setError((await joinPassport(slug)).error))
  }, [slug])
  if (!error) return null
  return (
    <div className="flex flex-col gap-2">
      <Notice tone="neutral">{error}</Notice>
      <button type="button" disabled={pending} className={buttonClass('ghost')} onClick={join}>
        Registrar entrada
      </button>
    </div>
  )
}
