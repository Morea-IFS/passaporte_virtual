import Link from 'next/link'
import { MetricBars } from '@/components/admin/metric-bars'
import { PageHeader } from '@/components/admin/page-header'
import { RankingList } from '@/components/passport/ranking-list'
import { buttonClass } from '@/components/ui/button'
import { Card, Panel } from '@/components/ui/card'
import { Disclosure } from '@/components/ui/disclosure'
import { Pagination } from '@/components/ui/pagination'
import { api } from '@/lib/api'
import { parseId, parsePage } from '@/lib/params'
import { hrefWith } from '@/lib/url'

export default async function EventDataPage({
  params,
  searchParams,
}: PageProps<'/admin/eventos/[eventId]/dados'>) {
  const eventId = parseId((await params).eventId)
  const page = parsePage((await searchParams).pagina)
  const data = await api.eventAnalytics(eventId, page)
  const eventPath = `/admin/eventos/${eventId}`
  const path = `${eventPath}/dados`
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
    checkpoints.map((cp) => ({
      key: cp.id,
      label: `${cp.code} · ${cp.name}${cp.isActive ? '' : ' (desativado)'}`,
      value: cp.visits,
    }))
  return (
    <>
      <PageHeader
        title="Dados do evento"
        description={data.event.name}
        back={{ href: eventPath, label: 'Pontos do evento' }}
        actions={
          <>
            <a href={path} className={buttonClass('ghost')}>
              Atualizar dados
            </a>
            <a
              href={`${path}/csv`}
              download={`indicadores-${eventId}.csv`}
              className={buttonClass('primary')}
            >
              Exportar indicadores (CSV)
            </a>
          </>
        }
      />
      <p className="text-sm text-muted">
        Atualizado em{' '}
        {new Date(data.generatedAt).toLocaleString('pt-BR', { timeZone: data.timezone })}. Datas e
        horas no fuso de Brasília.
      </p>
      <section aria-label="Resumo do evento" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map(([label, value]) => (
          <Card key={label} as="div" interactive={false} className="gap-1 p-4">
            <p className="font-mono text-2xl font-bold text-accent">
              {value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </p>
            <h2 className="text-sm font-semibold">{label}</h2>
          </Card>
        ))}
      </section>
      <p className="text-sm text-muted">
        Passaportes criados incluem quem ainda não carimbou. A média considera todos os
        participantes. Um passaporte está completo quando todos os pontos disponíveis para aquela
        pessoa foram visitados; um evento sem pontos não gera conclusão.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel as="section">
          <h2 className="font-display text-lg font-bold">Pontos mais visitados</h2>
          <MetricBars items={checkpointBars(data.checkpoints.slice(0, 5))} />
        </Panel>
        <Panel as="section">
          <h2 className="font-display text-lg font-bold">Pontos menos visitados</h2>
          <MetricBars items={checkpointBars(leastVisited.slice(0, 5))} />
        </Panel>
      </div>
      <Disclosure title={`Todos os pontos (${data.checkpoints.length})`}>
        <MetricBars
          items={checkpointBars(data.checkpoints)}
          emptyLabel="Nenhum ponto cadastrado."
        />
      </Disclosure>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel as="section">
          <h2 className="font-display text-lg font-bold">Visitas por categoria</h2>
          <MetricBars
            items={data.categories.map((category) => ({
              key: category.id,
              label: category.name,
              value: category.visits,
            }))}
          />
        </Panel>
        <Panel as="section">
          <h2 className="font-display text-lg font-bold">Progresso dos passaportes</h2>
          <MetricBars
            items={data.progress.map((bucket) => ({
              key: bucket.label,
              label: bucket.label,
              value: bucket.count,
            }))}
          />
        </Panel>
        <Panel as="section">
          <h2 className="font-display text-lg font-bold">Visitas por dia</h2>
          <MetricBars
            items={data.daily.map((day) => ({
              key: day.date,
              label: day.date.split('-').reverse().join('/'),
              value: day.visits,
            }))}
          />
        </Panel>
        <Panel as="section">
          <h2 className="font-display text-lg font-bold">Visitas por hora</h2>
          <p className="text-sm text-muted">Soma de todos os dias, em horário de Brasília.</p>
          <MetricBars
            items={data.hourly.map((hour) => ({
              key: hour.hour,
              label: `${String(hour.hour).padStart(2, '0')}h`,
              value: hour.visits,
            }))}
          />
        </Panel>
      </div>
      <section aria-labelledby="ranking-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="ranking-title" className="font-display text-lg font-bold">
            Ranking por apelido
          </h2>
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
          hrefFor={(pagina) => hrefWith(path, { pagina })}
        />
      </section>
      <p className="text-sm text-muted">
        Registros excluídos não entram nos indicadores. Pontos desativados mantêm carimbos
        existentes; novos carimbos ficam bloqueados.
      </p>
    </>
  )
}
