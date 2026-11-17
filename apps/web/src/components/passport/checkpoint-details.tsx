'use client'

import { useRef } from 'react'
import { buttonClass } from '@/components/ui/button'
import { Actions } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import type { PassportCheckpoint } from '@/lib/types'

type CheckpointDetailsProps = {
  checkpoint: Pick<PassportCheckpoint, 'code' | 'name' | 'summary' | 'teamInfo'>
  className?: string
}

/** Nome clicável do ponto e seus detalhes públicos. */
export function CheckpointDetails({ checkpoint, className = '' }: CheckpointDetailsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className={`rounded-xs text-left underline decoration-line decoration-1 underline-offset-3 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
      >
        {checkpoint.name}
      </button>

      <Modal dialogRef={dialogRef} title={checkpoint.name}>
        <p className="font-mono text-[12px] tracking-wide text-muted">{checkpoint.code}</p>
        <section
          className="flex flex-col gap-1.5"
          aria-labelledby={`${checkpoint.code}-description`}
        >
          <h3 id={`${checkpoint.code}-description`} className="font-display text-sm font-extrabold">
            Sobre o ponto
          </h3>
          <p className="text-[15px] break-words whitespace-pre-wrap text-muted">
            {checkpoint.summary || 'Descrição não informada.'}
          </p>
        </section>
        <section className="flex flex-col gap-1.5" aria-labelledby={`${checkpoint.code}-team`}>
          <h3 id={`${checkpoint.code}-team`} className="font-display text-sm font-extrabold">
            Equipe da apresentação
          </h3>
          <p className="text-[15px] break-words whitespace-pre-wrap text-muted">
            {checkpoint.teamInfo || 'Equipe não informada.'}
          </p>
        </section>
        <Actions align="end">
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            className={buttonClass('primary')}
          >
            Fechar
          </button>
        </Actions>
      </Modal>
    </>
  )
}
