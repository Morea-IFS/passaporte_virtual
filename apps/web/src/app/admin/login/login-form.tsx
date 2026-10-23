'use client'

import { useActionState } from 'react'
import { login } from '@/app/admin/actions'
import { Notice } from '@/components/ui/feedback'
import { TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import type { FormState } from '@/lib/types'

export function LoginForm() {
  const [state, action] = useActionState(login, {} as FormState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Notice tone="error">{state.error}</Notice>
      <TextField
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <TextField
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <SubmitButton pendingLabel="Entrando..." block>
        Entrar
      </SubmitButton>
    </form>
  )
}
