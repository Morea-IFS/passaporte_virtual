'use client'

import { useRef, useState, useTransition } from 'react'
import { buttonClass } from '@/components/ui/button'
import { Actions } from '@/components/ui/card'
import { InlineError } from '@/components/ui/feedback'
import { Modal } from '@/components/ui/modal'

type ConfirmDialogProps = {
  /** Conteúdo e classes do botão que abre o modal */
  trigger: React.ReactNode
  triggerClassName: string
  title: string
  description: string
  confirmLabel: string
  pendingLabel: string
  /** Pode devolver { error } para manter o modal aberto com a mensagem */
  onConfirm: () => Promise<unknown>
}

/**
 * Confirmação de ação destrutiva em modal centralizado.
 */
export function ConfirmDialog({
  trigger,
  triggerClassName,
  title,
  description,
  confirmLabel,
  pendingLabel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function confirm() {
    startTransition(async () => {
      const result = await onConfirm()
      const message =
        result && typeof result === 'object' && 'error' in result ? result.error : undefined
      if (typeof message === 'string') {
        setError(message)
        return
      }
      dialogRef.current?.close()
    })
  }

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => {
          setError(undefined)
          dialogRef.current?.showModal()
        }}
      >
        {trigger}
      </button>

      <Modal dialogRef={dialogRef} title={title} locked={pending}>
        <div className="flex flex-col gap-2">
          <p className="text-[15px] text-muted">{description}</p>
          <InlineError>{error}</InlineError>
        </div>
        <Actions align="end">
          <button
            type="button"
            autoFocus
            disabled={pending}
            onClick={() => dialogRef.current?.close()}
            className={buttonClass('ghost')}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={confirm}
            className={buttonClass('dangerSolid')}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </Actions>
      </Modal>
    </>
  )
}
