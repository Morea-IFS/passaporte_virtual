import { Suspense } from 'react'
import Link from 'next/link'
import { MetricBars, MetricColumns } from '@/components/admin/metric-bars'
import { PageHeader } from '@/components/admin/page-header'
import { PageSkeleton } from '@/components/admin/page-skeleton'
import { RankingList } from '@/components/passport/ranking-list'
import { buttonClass } from '@/components/ui/button'
import { Card, Panel } from '@/components/ui/card'
import { Disclosure } from '@/components/ui/disclosure'
import { EmptyState } from '@/components/ui/feedback'
import { FilterChip } from '@/components/ui/filter-chip'
import { Pagination } from '@/components/ui/pagination'
import { SelectField } from '@/components/ui/select-field'
import { api } from '@/lib/api'
import { pluralize } from '@/lib/format'
import { parsePage } from '@/lib/params'
import { firstParam, hrefWith } from '@/lib/url'

type DashboardView = 'dados' | 'avaliacoes'

export default function DashboardPage({ searchParams }: PageProps<'/admin/dashboard'>) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Escolha um evento para acompanhar os indicadores e as avaliações."
      />
      <Suspense fallback={<PageSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: PageProps<'/admin/dashboard'>['searchParams']
}) {
  const query = await searchParams
  const options = await api.auditOptions()
  const requestedId = Number(firstParam(query.evento))
  const selectedEvent = options.events.find((event) => event.id === requestedId)
  const view: DashboardView = firstParam(query.visao) === 'avaliacoes' ? 'avaliacoes' : 'dados'
  const page = parsePage(query.pagina)

  return (
    <>
      <Panel as="section" className="gap-4">
        <form method="get" className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="flex flex-col gap-1.5">
            <span className="font-display text-[13px] font-bold">Evento</span>
            <SelectField
              key={selectedEvent?.id ?? 'no-event'}
              name="evento"
              label="Escolher evento"
              defaultValue={selectedEvent ? String(selectedEvent.id) : ''}
              options={[
                { value: '', label: 'Escolha um evento' },
                ...options.events.map((event) => ({
                  value: String(event.id),
                  label: event.name,
                })),
              ]}
            />
          </div>
          <input type="hidden" name="visao" value={view} />
          <button type="submit" className={buttonClass('primary')}>
            Visualizar
          </button>
        </form>

        {selectedEvent ? (
          <nav aria-label="Conteúdo do dashboard" className="scrollbar-none overflow-x-auto">
            <ul className="flex gap-2">
              <li>
                <FilterChip
                  href={hrefWith('/admin/dashboard', {
                    evento: selectedEvent.id,
                  })}
                  active={view === 'dados'}
                >
                  Dados
                </FilterChip>
              </li>
              <li>
                <FilterChip
                  href={hrefWith('/admin/dashboard', {
                    evento: selectedEvent.id,
                    visao: 'avaliacoes',
                  })}
                  active={view === 'avaliacoes'}
                >
                  Avaliações
                </FilterChip>
              </li>
            </ul>
          </nav>
        ) : null}
      </Panel>

      {selectedEvent ? (
        view === 'avaliacoes' ? (
          <EvaluationDashboard eventId={selectedEvent.id} />
        ) : (
          <EventDataDashboard eventId={selectedEvent.id} page={page} />
        )
      ) : (
        <EmptyState
          title={options.events.length ? 'Escolha um evento' : 'Nenhum evento cadastrado'}
        >
          {options.events.length
            ? 'Use o seletor acima para visualizar os dados e as avaliações.'
            : 'Cadastre um evento para começar a acompanhar os resultados.'}
        </EmptyState>
      )}
    </>
  )
}

async function EventDataDashboard({ eventId, page }: { eventId: number; page: number }) {
  const data = await api.eventAnalytics(eventId, page)
  const path = hrefWith('/admin/dashboard', { evento: eventId })
  const summary = data.summary
  const metrics = [
    ['Passaportes criados', summary.participants],
    ['Visitantes com carimbos', summary.visitorsWithCheckins],
    ['Check-ins válidos', summary.totalCheckins],
    ['Média de pontos por pessoa', summary.averageVisited],
    ['Passaportes completos', summary.completedPassports],
    ['Pontos ativos', summary.activeCheckpoints],
  ] as const
  const leastVisited = [...data.checkpoints].sort(
    (a, b) => a.visits - b.visits || a.code.localeCompare(b.code)
  )
  const checkpointBars = (checkpoints: typeof data.checkpoints) =>
    checkpoints.map((checkpoint) => ({
      key: checkpoint.id,
      label: `${checkpoint.code} · ${checkpoint.name}${checkpoint.isActive ? '' : ' (desativado)'}`,
      value: checkpoint.visits,
    }))

  return (
    <section className="flex flex-col gap-8" aria-labelledby="dashboard-event-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 id="dashboard-event-title" className="text-2xl font-extrabold text-accent">
            Dados do evento
          </h2>
          <p className="text-muted">{data.event.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={path} className={buttonClass('ghost')}>
            Atualizar dados
          </a>
          <a
            href={`/admin/eventos/${eventId}/dados/csv`}
            download={`indicadores-${eventId}.csv`}
            className={buttonClass('primary')}
          >
            Exportar indicadores (CSV)
          </a>
        </div>
      </div>

      <p className="text-sm text-muted">
        Atualizado em{' '}
        {new Date(data.generatedAt).toLocaleString('pt-BR', {
          timeZone: data.timezone,
        })}
        . Datas e horas no fuso de Brasília.
      </p>
      <section aria-label="Resumo do evento" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map(([label, value]) => (
          <Card key={label} as="div" interactive={false} className="gap-1 p-4">
            <p className="font-mono text-2xl font-bold text-accent">
              {value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </p>
            <h3 className="text-sm font-semibold">{label}</h3>
          </Card>
        ))}
      </section>
      <p className="text-sm text-muted">
        Passaportes criados incluem quem ainda não carimbou. A média considera todos os
        participantes. Um passaporte está completo quando todos os pontos disponíveis para aquela
        pessoa foram visitados; um evento sem pontos não gera conclusão.
      </p>
      <div className="grid items-start gap-4 lg:grid-cols-12">
        <Panel as="section" className="lg:col-span-7">
          <h3 className="font-display text-lg font-bold">Pontos mais visitados</h3>
          <MetricBars items={checkpointBars(data.checkpoints.slice(0, 5))} />
        </Panel>
        <Panel as="section" className="lg:col-span-5">
          <h3 className="font-display text-lg font-bold">Pontos menos visitados</h3>
          <MetricBars items={checkpointBars(leastVisited.slice(0, 5))} />
        </Panel>
        <Panel as="section" className="lg:col-span-5">
          <h3 className="font-display text-lg font-bold">Visitas por categoria</h3>
          <MetricBars
            items={data.categories.map((category) => ({
              key: category.id,
              label: category.name,
              value: category.visits,
            }))}
          />
        </Panel>
        <Panel as="section" className="lg:col-span-7">
          <h3 className="font-display text-lg font-bold">Progresso dos passaportes</h3>
          <MetricBars
            items={data.progress.map((bucket) => ({
              key: bucket.label,
              label: bucket.label,
              value: bucket.count,
            }))}
          />
        </Panel>
        <Panel as="section" className="lg:col-span-5">
          <div>
            <h3 className="font-display text-lg font-bold">Visitas por dia</h3>
            <p className="text-sm text-muted">Movimento diário durante o evento.</p>
          </div>
          <MetricColumns
            minimumColumnWidth={36}
            items={data.daily.map((day) => ({
              key: day.date,
              label: day.date.split('-').reverse().slice(0, 2).join('/'),
              value: day.visits,
            }))}
          />
        </Panel>
        <Panel as="section" className="lg:col-span-7">
          <div>
            <h3 className="font-display text-lg font-bold">Visitas por hora</h3>
            <p className="text-sm text-muted">Soma dos dias, no horário de Brasília.</p>
          </div>
          <MetricColumns
            labelEvery={3}
            items={data.hourly.map((hour) => ({
              key: hour.hour,
              label: `${String(hour.hour).padStart(2, '0')}h`,
              value: hour.visits,
            }))}
          />
        </Panel>
      </div>
      <Disclosure title={`Todos os pontos (${data.checkpoints.length})`}>
        <MetricBars
          items={checkpointBars(data.checkpoints)}
          emptyLabel="Nenhum ponto cadastrado."
        />
      </Disclosure>
      <section aria-labelledby="ranking-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 id="ranking-title" className="font-display text-lg font-bold">
            Ranking por apelido
          </h3>
          <Link
            href={`/passaporte/${encodeURIComponent(data.event.slug)}/ranking`}
            className={buttonClass('ghost')}
          >
            Abrir ranking público
          </Link>
        </div>
        <RankingList entries={data.ranking.data} />
        <Pagination
          metadata={data.ranking.metadata}
          label="Páginas do ranking de participantes"
          hrefFor={(pagina) =>
            hrefWith('/admin/dashboard', {
              evento: eventId,
              pagina: pagina > 1 ? pagina : undefined,
            })
          }
        />
      </section>
      <p className="text-sm text-muted">
        Registros excluídos não entram nos indicadores. Pontos desativados mantêm carimbos
        existentes; novos carimbos ficam bloqueados.
      </p>
    </section>
  )
}

async function EvaluationDashboard({ eventId }: { eventId: number }) {
  const [event, summary] = await Promise.all([api.event(eventId), api.evaluationSummary(eventId)])

  return (
    <section className="flex flex-col gap-4" aria-labelledby="evaluation-title">
      <div className="flex flex-col gap-1">
        <h2 id="evaluation-title" className="text-2xl font-extrabold text-accent">
          Avaliações do evento
        </h2>
        <p className="text-muted">{event.name}</p>
      </div>
      {event.evaluationMode === 'external' ? (
        <Panel>
          <p>
            O evento utiliza formulário externo. Consulte os resultados na plataforma escolhida pela
            organização.
          </p>
          {event.evaluationUrl ? (
            <a
              href={event.evaluationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 py-3 font-bold text-accent underline"
            >
              Abrir formulário externo (outra aba)
            </a>
          ) : null}
        </Panel>
      ) : null}
      <Panel>
        <h3 className="text-xl font-bold">Avaliações na aplicação</h3>
        <p>
          {pluralize(summary.total, 'resposta', 'respostas')} · Média:{' '}
          {summary.average?.toLocaleString('pt-BR', {
            maximumFractionDigits: 2,
          }) ?? '—'}{' '}
          de 5
        </p>
        <ul className="flex flex-col gap-2">
          {summary.distribution.map((row) => (
            <li key={row.rating}>
              {row.rating} {row.rating === 1 ? 'estrela' : 'estrelas'}: {row.total}
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  )
}
