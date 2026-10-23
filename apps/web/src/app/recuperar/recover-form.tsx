'use client'

import { useActionState } from 'react'
import { recoverPassport } from '@/app/passaporte/actions'
import { Notice } from '@/components/ui/feedback'
import { TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import type { FormState } from '@/lib/types'

export function RecoverForm({ returnTo }: { returnTo: string }) {
  const [state, action] = useActionState(recoverPassport.bind(null, returnTo), {} as FormState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Notice tone="error">{state.error}</Notice>
      <TextField
        name="nickname"
        label="Apelido"
        required
        autoCapitalize="none"
        autoComplete="nickname"
        defaultValue={state.values?.nickname}
      />
      <TextField
        name="code"
        label="Código de recuperação"
        required
        autoCapitalize="characters"
        autoComplete="off"
        placeholder="ex.: K7Q2-MX9A"
        hint="Aparece no seu passaporte, em “Usar em outro celular”."
      />
      <SubmitButton pendingLabel="Abrindo..." block>
        Abrir meu passaporte
      </SubmitButton>
    </form>
  )
}
