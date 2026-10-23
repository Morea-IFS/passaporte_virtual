'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { saveAdministrator } from '@/app/admin/actions'
import { Actions } from '@/components/ui/card'
import { buttonClass } from '@/components/ui/button'
import { Notice } from '@/components/ui/feedback'
import { TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import type { Administrator, FormState } from '@/lib/types'

export function AdministratorForm({ administrator }: { administrator?: Administrator }) {
  const [state, action] = useActionState(
    saveAdministrator.bind(null, administrator?.id ?? null),
    {} as FormState
  )
  const errors = state.fieldErrors ?? {}
  return (
    <form action={action} className="flex flex-col gap-5">
      <Notice tone="error">{state.error}</Notice>
      <TextField
        name="fullName"
        label="Nome"
        required
        maxLength={160}
        defaultValue={state.values?.fullName ?? administrator?.fullName ?? ''}
        error={errors.fullName}
      />
      <TextField
        name="email"
        type="email"
        label="E-mail"
        required
        maxLength={254}
        defaultValue={state.values?.email ?? administrator?.email ?? ''}
        error={errors.email}
      />
      <TextField
        name="password"
        type="password"
        label={administrator ? 'Nova senha' : 'Senha'}
        required={!administrator}
        minLength={8}
        maxLength={200}
        hint={
          administrator ? 'Deixe em branco para manter a senha atual.' : 'Mínimo de 8 caracteres.'
        }
        error={errors.password}
        autoComplete="new-password"
      />
      <Actions>
        <Link href="/admin/administradores" className={buttonClass('ghost')}>
          Cancelar
        </Link>
        <SubmitButton pendingLabel="Salvando...">Salvar administrador</SubmitButton>
      </Actions>
    </form>
  )
}
