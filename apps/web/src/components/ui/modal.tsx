'use client'

import { useId, type RefObject } from 'react'

type ModalProps = {
  dialogRef: RefObject<HTMLDialogElement | null>
  title: string
  /** Impede fechar (Esc ou toque fora) enquanto uma ação está em andamento */
  locked?: boolean
  onClose?: () => void
  children: React.ReactNode
}

/**
 * Modal centralizado sobre <dialog> nativo (foco preso, Esc fecha, fundo
 * escurecido). Abrir com dialogRef.current.showModal(). Toque fora fecha.
 */
export function Modal({ dialogRef, title, locked, onClose, children }: ModalProps) {
  const titleId = useId()

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        if (locked) e.preventDefault()
      }}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current && !locked) dialogRef.current?.close()
      }}
      className="m-auto w-[min(100%-32px,400px)] rounded-m border border-line bg-surface p-0 font-sans text-base font-normal tracking-normal text-fg normal-case shadow-[0_24px_60px_-20px_rgba(29,17,71,0.6)] backdrop:bg-violeta-noite/60"
    >
      <div className="flex flex-col gap-5 p-5">
        <h2 id={titleId} className="text-xl font-black text-accent">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}
