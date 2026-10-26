import type { Metadata } from 'next'
import { NicknameForm } from '@/components/passport/nickname-form'
import { ProgressBar } from '@/components/passport/progress-bar'
import { RecoveryCode } from '@/components/passport/recovery-code'
import { Stamp } from '@/components/passport/stamp'
import { VisitorShell } from '@/components/passport/visitor-shell'
import { BackLink } from '@/components/ui/back-link'
import { Card, Panel } from '@/components/ui/card'
import { CategoryChip } from '@/components/ui/category-chip'
import { Disclosure } from '@/components/ui/disclosure'
import { EmptyState } from '@/components/ui/feedback'
import { FilterChip } from '@/components/ui/filter-chip'
import { api, VisitorUnauthorizedError } from '@/lib/api'
import { colorStyles } from '@/lib/categories'
import { formatEventPeriod, pluralize } from '@/lib/format'
import type { Passport, VisitorAccount } from '@/lib/types'
import { firstParam, hrefWith } from '@/lib/url'

export const metadata: Metadata = {
  title: 'Meu passaporte',
}

/** Passaporte do visitante; sem passaporte neste celular, a lista pública do evento */
async function loadPassport(slug: string) {
  try {
    const [passport, account] = await Promise.all([api.passport(slug), api.visitorMe()])
    return { passport, account: account as VisitorAccount | null }
  } catch (error) {
    if (!(error instanceof VisitorUnauthorizedError)) throw error
    return { passport: (await api.publicEvent(slug)) as Passport, account: null }
  }
}

/**
 * Passaporte do evento (RF13, RF14, RF16): progresso, carimbos coletados,
 * pontos que faltam (filtráveis por categoria) e o código de recuperação.
 */
export default async function PassportPage({
  params,
  searchParams,
}: PageProps<'/passaporte/[slug]'>) {
  const slug = (await params).slug
  const query = await searchParams
  const categoria = firstParam(query.categoria)
  const welcome = firstParam(query.bemvindo) === '1'
  const { passport, account } = await loadPassport(slug)
  const { event, categories } = passport
  const path = `/passaporte/${event.slug}`

  const selected = categories.find((category) => String(category.id) === categoria)
  const inCategory = passport.checkpoints.filter(
    (checkpoint) => !selected || checkpoint.categoryId === selected.id
  )
  const visited = inCategory.filter((checkpoint) => checkpoint.visitedAt)
  const pending = inCategory.filter((checkpoint) => !checkpoint.visitedAt)

  return (
    <VisitorShell homeHref="/?escolher=1">
      <BackLink href="/?escolher=1" label="Trocar de evento" />
      <header className="flex flex-col gap-1">
        <p className="font-display text-xs font-bold tracking-[0.14em] text-muted uppercase">
          {account ? (
            <>
              Passaporte de <span className="tracking-normal normal-case">{account.nickname}</span>
            </>
          ) : (
            'Pontos do evento'
          )}
        </p>
        <h1 className="text-[28px] leading-[1.1] font-black text-accent">{event.name}</h1>
        <p className="text-[15px] text-muted">
          {formatEventPeriod(event.startsOn, event.endsOn)}
          {event.location ? ` · ${event.location}` : ''}
        </p>
      </header>

      {account && welcome ? (
        <Panel className="gap-3">
          <p className="font-display text-xl font-black text-accent">Passaporte criado!</p>
          <p className="text-[15px] text-muted">
            Agora é só ler o QR code dos estandes e atividades para carimbar.
          </p>
          <RecoveryCode code={account.recoveryCode} nickname={account.nickname} />
        </Panel>
      ) : null}

      {account ? (
        <ProgressBar progress={passport.progress} caption="pontos visitados" />
      ) : (
        <Panel>
          <NicknameForm start={{ eventSlug: event.slug }} returnTo={path} />
        </Panel>
      )}

      <nav aria-label="Filtrar por categoria" className="-mx-4 scrollbar-none overflow-x-auto px-4">
        <ul className="flex gap-2">
          <li>
            <FilterChip href={path} active={!selected}>
              Todos
            </FilterChip>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <FilterChip
                href={hrefWith(path, { categoria: category.id })}
                active={selected?.id === category.id}
                activeClassName={colorStyles(category.color).chip}
              >
                {category.name}
              </FilterChip>
            </li>
          ))}
        </ul>
      </nav>

      {account ? (
        <section aria-labelledby="carimbos" className="flex flex-col gap-3">
          <h2 id="carimbos" className="text-lg font-extrabold">
            Carimbos
          </h2>
          {visited.length === 0 ? (
            <EmptyState title="Nenhum carimbo ainda">
              Leia o QR code dos estandes e atividades para carimbar.
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-3 gap-x-3 gap-y-4">
              {visited.map((checkpoint) => (
                <li
                  key={checkpoint.code}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <Stamp
                    code={checkpoint.code}
                    categoryName={checkpoint.category.name}
                    color={checkpoint.category.color}
                    date={checkpoint.visitedAt!}
                    label={`Carimbo de ${checkpoint.name}`}
                    className="w-full max-w-24"
                  />
                  <span className="line-clamp-2 text-[12px] leading-tight font-semibold">
                    {checkpoint.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="faltam" className="flex flex-col gap-3">
        <h2 id="faltam" className="text-lg font-extrabold">
          {account ? 'Faltam' : pluralize(pending.length, 'ponto', 'pontos')}
        </h2>
        {pending.length === 0 ? (
          <EmptyState title={account ? 'Você passou por todos!' : 'Nenhum ponto nesta categoria'}>
            {account ? 'Todos os pontos desta seleção já estão no seu passaporte.' : null}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((checkpoint) => (
              <Card key={checkpoint.code} interactive={false} className="gap-1.5 p-3">
                <span className="font-mono text-[11px] tracking-wide text-muted">
                  {checkpoint.code}
                  {checkpoint.location ? ` · ${checkpoint.location}` : ''}
                </span>
                <span className="font-display leading-tight font-extrabold">{checkpoint.name}</span>
                <span>
                  <CategoryChip category={checkpoint.category} />
                </span>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {account && !welcome ? (
        <Disclosure title="Usar em outro celular" summary="Seu código de recuperação">
          <RecoveryCode code={account.recoveryCode} nickname={account.nickname} />
        </Disclosure>
      ) : null}

      {event.hashtag ? (
        <p className="text-center font-display font-bold text-accent">{event.hashtag}</p>
      ) : null}
    </VisitorShell>
  )
}
