import Link from 'next/link'
import { CheckpointCard } from '@/components/admin/checkpoint-card'
import {
  CheckpointFilters,
  type CheckpointFilterValues,
} from '@/components/admin/checkpoint-filters'
import { PageHeader } from '@/components/admin/page-header'
import { Pagination } from '@/components/admin/pagination'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, Notice } from '@/components/ui/feedback'
import { QrIcon } from '@/components/ui/icons'
import { api } from '@/lib/api'
import { formatEventPeriod, pluralize } from '@/lib/format'
import { parseId, parsePage } from '@/lib/params'
import { firstParam, hrefWith } from '@/lib/url'

export default async function EventPage({
  params,
  searchParams,
}: PageProps<'/admin/eventos/[eventId]'>) {
  const eventId = parseId((await params).eventId)
  const query = await searchParams

  const categoria = firstParam(query.categoria)
  const status = firstParam(query.status)
  const filters: CheckpointFilterValues = {
    categoria: categoria && /^\d+$/.test(categoria) ? categoria : undefined,
    status: status === 'ativos' || status === 'desativados' ? status : undefined,
    q: firstParam(query.q)?.trim() || undefined,
  }
  const imported = Number(firstParam(query.importados)) || 0
  const page = parsePage(query.pagina)

  const [event, categories, { data: checkpoints, metadata }] = await Promise.all([
    api.event(eventId),
    api.categories(eventId),
    api.checkpoints(eventId, {
      categoryId: filters.categoria,
      status: filters.status === 'ativos' ? 'active' : filters.status ? 'inactive' : undefined,
      q: filters.q,
      page,
    }),
  ])
  const listPath = `/admin/eventos/${event.id}`
  const filtering = Boolean(filters.categoria || filters.status || filters.q)

  return (
    <>
      <PageHeader
        title={event.name}
        back={{ href: '/admin', label: 'Eventos' }}
        description={
          <div className="flex flex-col gap-1">
            <span>
              {formatEventPeriod(event.startsOn, event.endsOn)}
              {event.location ? ` · ${event.location}` : ''}
            </span>
            {event.hashtag ? (
              <span className="font-display font-bold text-accent">{event.hashtag}</span>
            ) : null}
          </div>
        }
        actions={
          <>
            <Link href={`${listPath}/editar`} className={buttonClass('ghost')}>
              Editar evento
            </Link>
            <Link href={`${listPath}/categorias`} className={buttonClass('ghost')}>
              Editar categorias
            </Link>
          </>
        }
      />

      {imported > 0 ? (
        <Notice tone="success">
          {pluralize(imported, 'ponto importado', 'pontos importados')} da planilha.
        </Notice>
      ) : null}

      <section className="flex flex-col gap-4" aria-labelledby="pontos">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="pontos" className="text-xl font-extrabold">
              Pontos do passaporte
            </h2>
            <p className="text-[15px] text-muted">
              {pluralize(event.checkpointsCount, 'ponto', 'pontos')} ·{' '}
              {pluralize(event.activeCheckpointsCount, 'ativo', 'ativos')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`${listPath}/pontos/novo`} className={buttonClass('primary')}>
              Novo ponto
            </Link>
            <Link href={`${listPath}/importar`} className={buttonClass('ghost')}>
              Importar planilha
            </Link>
            <Link href={`${listPath}/qrcodes`} className={buttonClass('ghost')}>
              <QrIcon className="size-4" />
              QR codes
            </Link>
          </div>
        </div>

        <CheckpointFilters
          eventId={event.id}
          categories={categories}
          filters={filters}
          hrefFor={(change) => hrefWith(listPath, { ...filters, ...change })}
        />

        {checkpoints.length === 0 ? (
          filtering ? (
            <EmptyState title="Nenhum ponto com esses filtros">
              <Link
                href={listPath}
                className="font-display text-[14px] font-bold text-accent underline underline-offset-4"
              >
                Limpar filtros
              </Link>
            </EmptyState>
          ) : (
            <EmptyState title="Nenhum ponto cadastrado">
              Cadastre um por um ou importe a lista de projetos de uma planilha.
            </EmptyState>
          )
        ) : (
          <ul className="flex flex-col gap-2">
            {checkpoints.map((checkpoint) => (
              <CheckpointCard key={checkpoint.id} checkpoint={checkpoint} />
            ))}
          </ul>
        )}

        <Pagination
          metadata={metadata}
          label="Páginas de pontos"
          hrefFor={(target) =>
            hrefWith(listPath, { ...filters, pagina: target > 1 ? target : undefined })
          }
        />
      </section>
    </>
  )
}
