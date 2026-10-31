import { api } from '@/lib/api'
import { parseId } from '@/lib/params'
import { PageHeader } from '@/components/admin/page-header'
import { Panel } from '@/components/ui/card'
import { pluralize } from '@/lib/format'

export default async function EvaluationResults({
  params,
}: PageProps<'/admin/eventos/[eventId]/avaliacoes'>) {
  const id = parseId((await params).eventId)
  const [event, summary] = await Promise.all([api.event(id), api.evaluationSummary(id)])
  return (
    <>
      <PageHeader
        title="Avaliações do evento"
        description={event.name}
        back={{ href: `/admin/eventos/${id}`, label: 'Evento' }}
      />
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
        <h2 className="text-xl font-bold">Avaliações na aplicação</h2>
        <p>
          {pluralize(summary.total, 'resposta', 'respostas')} · Média:{' '}
          {summary.average?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) ?? '—'} de 5
        </p>
        <ul className="flex flex-col gap-2">
          {summary.distribution.map((row) => (
            <li key={row.rating}>
              {row.rating} {row.rating === 1 ? 'estrela' : 'estrelas'}: {row.total}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}
