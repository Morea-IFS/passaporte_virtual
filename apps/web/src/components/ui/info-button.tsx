'use client'

import { useRef } from 'react'
import { buttonClass } from '@/components/ui/button'
import { Actions } from '@/components/ui/card'
import { InfoIcon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/modal'

export type InfoContent = {
  /** Título do modal */
  title: string
  content: React.ReactNode
}

/**
 * Ícone ⓘ que abre um modal com explicação mais longa, para não poluir
 * o formulário com texto. Use pelo prop `info` do Field.
 */
export function InfoButton({ title, content, label }: InfoContent & { label: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="-my-2 grid size-9 place-items-center rounded-full text-muted hover:text-accent"
      >
        <InfoIcon className="size-4" />
        <span className="sr-only">Mais informações sobre {label}</span>
      </button>
      <Modal dialogRef={dialogRef} title={title}>
        <div className="flex flex-col gap-3 text-[15px] text-muted">{content}</div>
        <Actions align="end">
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            className={buttonClass('primary')}
          >
            Entendi
          </button>
        </Actions>
      </Modal>
    </>
  )
}
