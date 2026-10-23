'use client'

import { useActionState, useState } from 'react'
import { createCategory, renameCategory } from '@/app/admin/actions'
import { buttonClass, quietButtonClass } from '@/components/ui/button'
import { Card, Panel } from '@/components/ui/card'
import { CategoryChip } from '@/components/ui/category-chip'
import { EmptyState } from '@/components/ui/feedback'
import { InlineField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { pluralize } from '@/lib/format'
import type { CheckpointCategory, FormState } from '@/lib/types'
import { DeleteCategoryDialog } from './delete-category-dialog'

export function CategoryManager({
  eventId,
  categories,
  allCategories,
}: {
  eventId: number
  /** Categorias desta página */
  categories: CheckpointCategory[]
  /** Todas as categorias do evento (destinos possíveis ao excluir) */
  allCategories: CheckpointCategory[]
}) {
  return (
    <div className="flex flex-col gap-6">
      <NewCategoryForm eventId={eventId} />

      {categories.length === 0 ? (
        <EmptyState title="Nenhuma categoria">Crie a primeira acima.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              others={allCategories.filter((other) => other.id !== category.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function NewCategoryForm({ eventId }: { eventId: number }) {
  const [state, action] = useActionState(createCategory.bind(null, eventId), {} as FormState)

  return (
    <Panel>
      <form action={action}>
        <InlineField
          id="new-category"
          label="Nova categoria"
          name="name"
          required
          maxLength={40}
          placeholder="Ex.: Palestra"
          defaultValue={state.values?.name}
          error={state.fieldErrors?.name ?? state.error}
        >
          <SubmitButton size="sm" pendingLabel="Criando...">
            Criar
          </SubmitButton>
        </InlineField>
      </form>
    </Panel>
  )
}

function CategoryRow({
  category,
  others,
}: {
  category: CheckpointCategory
  others: CheckpointCategory[]
}) {
  const [editing, setEditing] = useState(false)
  const [state, action] = useActionState(async (previous: FormState, formData: FormData) => {
    const result = await renameCategory(category.id, previous, formData)
    if (!result.error) setEditing(false)
    return result
  }, {} as FormState)

  return (
    <Card className="gap-3 p-3">
      {editing ? (
        <form action={action} className="flex flex-col gap-1">
          <InlineField
            id={`category-${category.id}`}
            label="Nome da categoria"
            labelHidden
            name="name"
            required
            maxLength={40}
            autoFocus
            defaultValue={state.values?.name ?? category.name}
            error={state.fieldErrors?.name ?? state.error}
          >
            <SubmitButton size="sm" pendingLabel="Salvando...">
              Salvar
            </SubmitButton>
          </InlineField>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className={`${quietButtonClass()} self-start`}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <CategoryChip category={category} />
            <span className="text-[13px] text-muted">
              {pluralize(category.checkpointsCount, 'ponto', 'pontos')}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={buttonClass('ghost', { size: 'sm' })}
            >
              Renomear
            </button>
            <DeleteCategoryDialog category={category} others={others} />
          </div>
        </div>
      )}
    </Card>
  )
}
