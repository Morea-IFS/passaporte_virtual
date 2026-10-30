'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { saveEvent } from '@/app/admin/actions'
import { buttonClass } from '@/components/ui/button'
import { DateField, todayIso } from '@/components/ui/date-field'
import { Actions } from '@/components/ui/card'
import { Notice } from '@/components/ui/feedback'
import { TextAreaField, TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { Field } from '@/components/ui/field'
import { OptionCard } from '@/components/ui/option-card'
import type { FormState, PassportEvent } from '@/lib/types'

type EventFormProps = {
  event?: PassportEvent
  cancelHref: string
}

export function EventForm({ event, cancelHref }: EventFormProps) {
  const [state, action] = useActionState(saveEvent.bind(null, event?.id ?? null), {} as FormState)
  const values = state.values
  const errors = state.fieldErrors ?? {}
  const [startsOn, setStartsOn] = useState(values?.startsOn ?? event?.startsOn ?? '')
  const [endsOn, setEndsOn] = useState(values?.endsOn ?? event?.endsOn ?? '')
  const [evaluationMode, setEvaluationMode] = useState(
    values?.evaluationMode ?? event?.evaluationMode ?? 'integrated'
  )

  return (
    <form action={action} className="flex flex-col gap-5">
      <Notice tone="error">{state.error}</Notice>

      <TextField
        name="name"
        label="Nome do evento"
        required
        maxLength={160}
        placeholder="23ª SNCT – Ciência Delas"
        defaultValue={values?.name ?? event?.name}
        error={errors.name}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <DateField
          name="startsOn"
          label="Início"
          value={startsOn}
          min={todayIso()}
          onChange={(date) => {
            setStartsOn(date)
            // Término acompanha: vazio ou antes do início vira o mesmo dia
            if (!endsOn || endsOn < date) setEndsOn(date)
          }}
          error={errors.startsOn}
        />
        <DateField
          name="endsOn"
          label="Término"
          value={endsOn}
          min={startsOn || todayIso()}
          onChange={setEndsOn}
          error={errors.endsOn}
        />
      </div>

      <TextField
        name="location"
        label="Local"
        maxLength={200}
        placeholder="Aracaju Parque Shopping"
        defaultValue={values?.location ?? event?.location ?? ''}
        hint="Onde o evento acontece."
        error={errors.location}
      />

      <TextField
        name="hashtag"
        label="Hashtag oficial"
        prefix="#"
        maxLength={79}
        placeholder="SNCT2026"
        defaultValue={(values?.hashtag ?? event?.hashtag ?? '').replace(/^#+/, '')}
        hint="Usada nos cards compartilhados nas redes sociais."
        error={errors.hashtag}
      />

      <TextAreaField
        name="description"
        label="Descrição"
        maxLength={2000}
        defaultValue={values?.description ?? event?.description ?? ''}
        error={errors.description}
      />

      <Field
        id="evaluation-mode"
        label="Avaliação do evento"
        as="group"
        error={errors.evaluationMode}
      >
        <OptionCard
          name="evaluationMode"
          value="integrated"
          checked={evaluationMode === 'integrated'}
          onChange={() => setEvaluationMode('integrated')}
          title="Na aplicação"
          description="O visitante avalia o evento de 1 a 5 estrelas, sem informar novos dados pessoais."
        />
        <OptionCard
          name="evaluationMode"
          value="external"
          checked={evaluationMode === 'external'}
          onChange={() => setEvaluationMode('external')}
          title="Formulário externo"
          description="O botão de avaliação abre o formulário indicado pela organização."
        />
      </Field>
      {evaluationMode === 'external' ? (
        <TextField
          name="evaluationUrl"
          label="Link da avaliação"
          type="url"
          required
          maxLength={2000}
          defaultValue={values?.evaluationUrl ?? event?.evaluationUrl ?? ''}
          placeholder="https://forms.example.com/avaliacao"
          error={errors.evaluationUrl}
        />
      ) : null}

      <Actions>
        <Link href={cancelHref} className={buttonClass('ghost')}>
          Cancelar
        </Link>
        <SubmitButton pendingLabel="Salvando...">
          {event ? 'Salvar alterações' : 'Cadastrar evento'}
        </SubmitButton>
      </Actions>
    </form>
  )
}
