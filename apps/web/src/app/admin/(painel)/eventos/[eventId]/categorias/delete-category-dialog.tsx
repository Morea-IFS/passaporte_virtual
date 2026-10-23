'use client'

import { useRef, useState, useTransition } from 'react'
import { deleteCategory } from '@/app/admin/actions'
import { CategoryPicker } from '@/components/admin/category-picker'
import { buttonClass, iconButtonClass } from '@/components/ui/button'
import { Actions } from '@/components/ui/card'
import { InlineError } from '@/components/ui/feedback'
import { TrashIcon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/modal'
import { pluralize } from '@/lib/format'
import type { CheckpointCategory } from '@/lib/types'

type Step = 'confirm' | 'ask-move' | 'choose' | 'blocked'

/**
 * Exclusão de categoria em etapas:
 * - sem pontos: confirma e exclui;
 * - com pontos: pergunta se quer mover todos para outra categoria.
 *   Sim → escolhe o destino e "Mover e excluir". Não → avisa que não dá.
 */
export function DeleteCategoryDialog({
  category,
  others,
}: {
  category: CheckpointCategory
  others: CheckpointCategory[]
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [step, setStep] = useState<Step>('confirm')
  const [target, setTarget] = useState<number>()
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const count = category.checkpointsCount
  const points = pluralize(count, 'ponto usa', 'pontos usam')

  function open() {
    setStep(count > 0 ? 'ask-move' : 'confirm')
    setTarget(undefined)
    setError(undefined)
    dialogRef.current?.showModal()
  }

  function close() {
    dialogRef.current?.close()
  }

  function remove(moveTo?: number) {
    startTransition(async () => {
      const result = await deleteCategory(category.id, moveTo)
      if (result.error) {
        setError(result.error)
        return
      }
      close()
    })
  }

  const titles: Record<Step, string> = {
    'confirm': 'Excluir categoria?',
    'ask-move': 'Categoria em uso',
    'choose': 'Mover pontos para…',
    'blocked': 'Não dá para excluir',
  }

  return (
    <>
      <button type="button" onClick={open} className={iconButtonClass('danger')}>
        <TrashIcon className="size-4" />
        <span className="sr-only">Excluir {category.name}</span>
      </button>

      <Modal dialogRef={dialogRef} title={titles[step]} locked={pending}>
        {step === 'confirm' ? (
          <>
            <p className="text-[15px] text-muted">&quot;{category.name}&quot; será excluída.</p>
            <Actions align="end">
              <button type="button" autoFocus onClick={close} className={buttonClass('ghost')}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove()}
                className={buttonClass('dangerSolid')}
              >
                {pending ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </Actions>
          </>
        ) : null}

        {step === 'ask-move' ? (
          <>
            <p className="text-[15px] text-muted">
              {points} &quot;{category.name}&quot;. Quer mover todos para outra categoria e excluir
              esta?
            </p>
            <Actions align="end">
              <button
                type="button"
                onClick={() => setStep('blocked')}
                className={buttonClass('ghost')}
              >
                Não
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => setStep(others.length > 0 ? 'choose' : 'blocked')}
                className={buttonClass('primary')}
              >
                Sim, mover
              </button>
            </Actions>
          </>
        ) : null}

        {step === 'choose' ? (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[15px] text-muted">
                {pluralize(count, 'O ponto de', 'Os pontos de')} &quot;{category.name}&quot; vão
                para a categoria escolhida.
              </legend>
              <CategoryPicker
                name={`move-${category.id}`}
                categories={others}
                value={target}
                onChange={setTarget}
              />
            </fieldset>
            <InlineError>{error}</InlineError>
            <Actions align="end">
              <button
                type="button"
                disabled={pending}
                onClick={() => setStep('ask-move')}
                className={buttonClass('ghost')}
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={pending || !target}
                onClick={() => remove(target)}
                className={buttonClass('dangerSolid')}
              >
                {pending ? 'Movendo...' : 'Mover e excluir'}
              </button>
            </Actions>
          </>
        ) : null}

        {step === 'blocked' ? (
          <>
            <p className="text-[15px] text-muted">
              {points} &quot;{category.name}&quot;.{' '}
              {others.length > 0
                ? 'Para excluir, mova os pontos para outra categoria.'
                : 'Crie outra categoria para poder mover os pontos e excluir esta.'}
            </p>
            <Actions align="end">
              <button type="button" autoFocus onClick={close} className={buttonClass('primary')}>
                Entendi
              </button>
            </Actions>
          </>
        ) : null}
      </Modal>
    </>
  )
}
