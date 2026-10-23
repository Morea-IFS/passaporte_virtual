'use client'

import { buttonClass } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type DangerZoneProps = {
  /** Ex.: "Excluir evento" — título da seção e texto do botão */
  title: string
  /** Explicação curta na página */
  description: React.ReactNode
  /** Pergunta e texto do modal de confirmação */
  question: string
  confirmDescription: string
  onConfirm: () => Promise<unknown>
}

/**
 * Seção de exclusão no fim das telas de edição, com confirmação em modal.
 */
export function DangerZone({
  title,
  description,
  question,
  confirmDescription,
  onConfirm,
}: DangerZoneProps) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="text-muted">{description}</p>
      <ConfirmDialog
        trigger={title}
        triggerClassName={buttonClass('danger', { blockOnMobile: true })}
        title={question}
        description={confirmDescription}
        confirmLabel="Sim, excluir"
        pendingLabel="Excluindo..."
        onConfirm={onConfirm}
      />
    </section>
  )
}
