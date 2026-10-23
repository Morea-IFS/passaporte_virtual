import type { Metadata } from 'next'
import { BrandLockup } from '@/components/brand-lockup'
import { BrandMosaic } from '@/components/brand-mosaic'
import { ThemeToggle } from '@/components/theme-toggle'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Entrar · Organização',
}

/**
 * Celular: mosaico no topo e o formulário numa folha que sobe sobre ele.
 * Desktop: tela dividida, mosaico à esquerda.
 */
export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col bg-violeta-noite lg:grid lg:grid-cols-[1fr_minmax(0,32rem)]">
      <BrandMosaic className="h-[34vh] min-h-52 shrink-0 lg:h-auto lg:min-h-full" />

      <section className="relative -mt-7 flex flex-1 flex-col rounded-t-[28px] bg-bg px-4 pt-6 pb-10 lg:mt-0 lg:justify-center lg:rounded-none lg:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <div className="flex items-start justify-between gap-4">
            <BrandLockup size="sm" />
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-display text-xs font-bold tracking-[0.14em] text-muted uppercase">
              Área da organização
            </p>
            <h1 className="text-2xl font-extrabold">Entrar no painel</h1>
            <p className="text-muted">Cadastre eventos e os pontos do passaporte.</p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
