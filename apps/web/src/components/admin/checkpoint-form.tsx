'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { saveCheckpoint } from '@/app/admin/actions'
import { CategoryPicker } from '@/components/admin/category-picker'
import { ImageInput } from '@/components/admin/image-input'
import { buttonClass } from '@/components/ui/button'
import { Actions } from '@/components/ui/card'
import { Notice } from '@/components/ui/feedback'
import { Field, TextAreaField, TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { Switch } from '@/components/ui/switch'
import type { Checkpoint, CheckpointCategory, FormState } from '@/lib/types'

type CheckpointFormProps = {
  eventId: number
  categories: CheckpointCategory[]
  checkpoint?: Checkpoint
}

export function CheckpointForm({ eventId, categories, checkpoint }: CheckpointFormProps) {
  const [state, action] = useActionState(
    saveCheckpoint.bind(null, eventId, checkpoint?.id ?? null),
    {} as FormState
  )
  const values = state.values
  const errors = state.fieldErrors ?? {}
  const categoryId = values?.categoryId ?? String(checkpoint?.categoryId ?? '')
  const isActive = values ? values.isActive === 'on' : (checkpoint?.isActive ?? true)
  return (
    <form action={action} className="flex flex-col gap-6">
      <Notice tone="error">
        {state.error ? `${state.error} Se escolheu imagens, selecione de novo.` : null}
      </Notice>

      <TextField
        name="name"
        label="Nome"
        required
        maxLength={160}
        placeholder="Microscopia: o que cabe numa gota"
        defaultValue={values?.name ?? checkpoint?.name}
        error={errors.name}
      />

      <Field id="field-categoryId" label="Categoria" as="group" error={errors.categoryId}>
        {categories.length === 0 ? (
          <p className="text-[15px] text-muted">
            Este evento ainda não tem categorias.{' '}
            <Link
              href={`/admin/eventos/${eventId}/categorias`}
              className="font-bold text-accent underline underline-offset-4"
            >
              Criar categorias
            </Link>
          </p>
        ) : (
          <CategoryPicker
            name="categoryId"
            categories={categories}
            defaultValue={categoryId ? Number(categoryId) : undefined}
            required
          />
        )}
      </Field>

      <TextField
        name="location"
        label="Local"
        maxLength={160}
        placeholder="Estande 14 · Piso L1"
        defaultValue={values?.location ?? checkpoint?.location ?? ''}
        hint="Onde o visitante encontra o ponto."
        error={errors.location}
      />

      <TextAreaField
        name="summary"
        label="Resumo"
        maxLength={1000}
        placeholder="Em poucas linhas, o que o visitante vai ver ou fazer."
        defaultValue={values?.summary ?? checkpoint?.summary ?? ''}
        error={errors.summary}
      />

      <ImageInput
        key={`image-${state.attempt ?? 0}`}
        name="image"
        label="Imagem de capa"
        description="Foto grande no topo da página que o visitante abre ao ler o QR code, como uma foto do estande ou da oficina."
        currentUrl={checkpoint?.imageUrl ?? null}
        error={errors.image}
      />

      <ImageInput
        key={`logo-${state.attempt ?? 0}`}
        name="logo"
        label="Logomarca do projeto"
        description="Logo do grupo de pesquisa ou do projeto. Prefira PNG com fundo transparente."
        currentUrl={checkpoint?.logoUrl ?? null}
        error={errors.logo}
      />

      <Switch
        name="isActive"
        defaultChecked={isActive}
        label="Ponto ativo"
        description="Desativado, o ponto não aceita novos carimbos. Os já feitos continuam valendo."
      />

      <Actions>
        <Link href={`/admin/eventos/${eventId}`} className={buttonClass('ghost')}>
          Cancelar
        </Link>
        <SubmitButton pendingLabel="Salvando...">
          {checkpoint ? 'Salvar alterações' : 'Cadastrar ponto'}
        </SubmitButton>
      </Actions>
    </form>
  )
}
