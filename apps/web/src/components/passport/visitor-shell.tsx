import Link from 'next/link'
import { BrandMark } from '@/components/brand-mark'
import { BrandMosaic } from '@/components/brand-mosaic'
import { leavePassport } from '@/app/passaporte/actions'
import { ThemeToggle } from '@/components/theme-toggle'
import { quietButtonClass } from '@/components/ui/button'
import { visitorSession } from '@/lib/session'

/** "Sair" do passaporte: só em desenvolvimento e com passaporte aberto */
async function DevLeaveButton() {
  if (process.env.NODE_ENV !== 'development' || !(await visitorSession.get())) return null
  return (
    <form action={leavePassport}>
      <button type="submit" className={quietButtonClass()}>
        Sair (dev)
      </button>
    </form>
  )
}

/**
 * Moldura das telas do visitante: o conteúdo numa folha arredondada com a
 * altura dele, e o mosaico ocupando o que sobra em cima (mínimo 112 px;
 * páginas longas rolam normalmente). Mesma linguagem do login.
 */
export function VisitorShell({
  homeHref,
  children,
}: {
  /** Link da marca no topo (ex.: o passaporte do evento) */
  homeHref?: string
  children: React.ReactNode
}) {
  const mark = <BrandMark />
  return (
    <main id="conteudo" tabIndex={-1} className="flex min-h-dvh flex-1 flex-col bg-violeta-noite">
      <BrandMosaic className="min-h-28 flex-1" />
      <section className="relative -mt-6 flex shrink-0 flex-col rounded-t-[28px] bg-bg px-4 pt-5 pb-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            {homeHref ? (
              <Link href={homeHref} className="flex min-h-11 items-center">
                {mark}
              </Link>
            ) : (
              mark
            )}
            <div className="flex items-center gap-1">
              <DevLeaveButton />
              <ThemeToggle />
            </div>
          </div>
          {children}
          <Link
            href="/privacidade"
            className="flex min-h-11 items-center justify-center text-[13px] text-muted underline"
          >
            Privacidade
          </Link>
        </div>
      </section>
    </main>
  )
}
