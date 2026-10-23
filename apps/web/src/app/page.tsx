import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { EventChoiceCard } from '@/components/passport/event-choice-card'
import { VisitorShell } from '@/components/passport/visitor-shell'
import { quietButtonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { api, VisitorUnauthorizedError } from '@/lib/api'
import { firstParam } from '@/lib/url'

export const metadata: Metadata = {
  title: 'Passaporte Virtual',
}

async function loadVisitor() {
  try {
    return await api.visitorPassports()
  } catch (error) {
    if (error instanceof VisitorUnauthorizedError) return null
    throw error
  }
}

/**
 * Entrada do visitante (QR da recepção). Um evento aberto: vai direto
 * para o passaporte dele. Vários: a pessoa escolhe.
 */
export default async function HomePage({ searchParams }: PageProps<'/'>) {
  // ?escolher=1: veio de "Trocar de evento", mostra a lista mesmo com um evento só
  const choosing = firstParam((await searchParams).escolher) === '1'
  const [events, visitor] = await Promise.all([api.publicEvents(), loadVisitor()])
  const open = events.filter((event) => !event.ended)
  const ended = events.filter((event) => event.ended)

  if (open.length === 1 && !choosing) redirect(`/passaporte/${open[0].slug}`)

  const visitedBySlug = new Map(
    visitor?.passports.map((passport) => [passport.slug, passport.visited])
  )
  const visitedFor = (slug: string) => (visitor ? (visitedBySlug.get(slug) ?? 0) : undefined)

  return (
    <VisitorShell>
      <header className="flex flex-col gap-2">
        <p className="font-display text-xs font-bold tracking-[0.14em] text-muted uppercase">
          {visitor ? (
            <>
              Olá, <span className="tracking-normal normal-case">{visitor.nickname}</span>
            </>
          ) : (
            'Passaporte Virtual'
          )}
        </p>
        <h1 className="text-[28px] leading-[1.1] font-black text-accent">Escolha o evento</h1>
        <p className="text-muted">
          {visitor
            ? 'Abra o passaporte do evento em que você está.'
            : 'Toque no evento em que você está para criar seu passaporte.'}
        </p>
      </header>

      {events.length === 0 ? (
        <EmptyState title="Nenhum evento por aqui ainda">
          Volte mais perto da data do evento.
        </EmptyState>
      ) : null}

      {open.length > 0 ? (
        <section aria-label="Eventos acontecendo e próximos" className="flex flex-col gap-2">
          <ul className="flex flex-col gap-2">
            {open.map((event) => (
              <EventChoiceCard key={event.slug} event={event} visited={visitedFor(event.slug)} />
            ))}
          </ul>
        </section>
      ) : null}

      {ended.length > 0 ? (
        <section aria-labelledby="encerrados" className="flex flex-col gap-2">
          <h2 id="encerrados" className="text-lg font-extrabold text-muted">
            Encerrados
          </h2>
          <ul className="flex flex-col gap-2 opacity-80">
            {ended.map((event) => (
              <EventChoiceCard key={event.slug} event={event} visited={visitedFor(event.slug)} />
            ))}
          </ul>
        </section>
      ) : null}

      {visitor ? null : (
        <Link
          href="/recuperar?voltar=%2F"
          className="self-center font-display text-[14px] font-bold text-accent underline underline-offset-4"
        >
          Já tenho passaporte
        </Link>
      )}

      <footer className="mt-6 flex justify-center border-t border-line pt-4">
        <Link href="/admin" className={quietButtonClass()}>
          Área da organização
        </Link>
      </footer>
    </VisitorShell>
  )
}
