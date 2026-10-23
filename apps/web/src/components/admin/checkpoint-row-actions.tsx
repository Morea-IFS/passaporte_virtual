'use client'

import { useOptimistic, useTransition } from 'react'
import { removeCheckpoint, setCheckpointStatus } from '@/app/admin/actions'
import { quietButtonClass } from '@/components/ui/button'
import { CardFooter } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TrashIcon } from '@/components/ui/icons'
import { Switch } from '@/components/ui/switch'
import type { Checkpoint } from '@/lib/types'

/**
 * Faixa de ações rápidas de um ponto na lista: ativar/desativar e excluir
 * (com confirmação em modal).
 */
export function CheckpointRowActions({
  checkpoint,
}: {
  checkpoint: Pick<Checkpoint, 'id' | 'name' | 'isActive'>
}) {
  const [isActive, setOptimisticActive] = useOptimistic(checkpoint.isActive)
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      setOptimisticActive(!isActive)
      await setCheckpointStatus(checkpoint.id, !isActive)
    })
  }

  return (
    <CardFooter>
      <Switch
        layout="inline"
        checked={isActive}
        disabled={pending}
        onChange={toggle}
        aria-label={`Ponto ativo: ${checkpoint.name}`}
        label={isActive ? 'Ativo' : 'Desativado'}
      />
      <ConfirmDialog
        trigger={
          <>
            <TrashIcon className="size-4" />
            Excluir
          </>
        }
        triggerClassName={quietButtonClass('danger')}
        title="Excluir ponto?"
        description={`"${checkpoint.name}" será excluído.`}
        confirmLabel="Sim, excluir"
        pendingLabel="Excluindo..."
        onConfirm={() => removeCheckpoint(checkpoint.id)}
      />
    </CardFooter>
  )
}
