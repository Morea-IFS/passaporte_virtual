import type { Metadata } from 'next'
import Link from 'next/link'
import { logout } from '@/app/admin/actions'
import { BrandMark } from '@/components/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { quietButtonClass } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Organização · Passaporte Virtual',
}

export default function PainelLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex min-h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/admin" className="flex min-h-11 items-center gap-2">
            <BrandMark />
            <span className="font-display text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
              Organização
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className={quietButtonClass()}>
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <nav aria-label="Área administrativa" className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 py-1">
          <Link href="/admin" className={quietButtonClass()}>
            Eventos
          </Link>
          <Link href="/admin/participantes" className={quietButtonClass()}>
            Participantes
          </Link>
          <Link href="/admin/administradores" className={quietButtonClass()}>
            Administradores
          </Link>
          <Link href="/admin/auditoria" className={quietButtonClass()}>
            Auditoria
          </Link>
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-6 pb-16">
        {children}
      </main>
    </div>
  )
}
