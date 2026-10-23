import type { Metadata } from 'next'
import { VisitorShell } from '@/components/passport/visitor-shell'
import { BackLink } from '@/components/ui/back-link'
import { firstParam, safePath } from '@/lib/url'
import { RecoverForm } from './recover-form'

export const metadata: Metadata = {
  title: 'Abrir meu passaporte',
}

/** Abre o passaporte neste celular com apelido + código (RF21) */
export default async function RecoverPage({ searchParams }: PageProps<'/recuperar'>) {
  const returnTo = safePath(firstParam((await searchParams).voltar))

  return (
    <VisitorShell>
      <BackLink href={returnTo} label="Voltar" />
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-[1.1] font-black text-accent">Já tenho passaporte</h1>
        <p className="text-muted">
          Informe seu apelido e o código de recuperação para abrir o passaporte neste celular.
        </p>
      </div>
      <RecoverForm returnTo={returnTo} />
    </VisitorShell>
  )
}
