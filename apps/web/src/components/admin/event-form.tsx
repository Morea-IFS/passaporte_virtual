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
