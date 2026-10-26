import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { Pagination } from '@/components/ui/pagination'
import { Card, Panel } from '@/components/ui/card'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { inputClass } from '@/components/ui/field'
import { SelectField } from '@/components/ui/select-field'
import { api } from '@/lib/api'
import { formatDateTime, pluralize } from '@/lib/format'
import { parsePage } from '@/lib/params'
import { firstParam, hrefWith } from '@/lib/url'

export default async function ParticipantsPage({
  searchParams,
}: PageProps<'/admin/participantes'>) {
  const params = await searchParams
  const q = firstParam(params.q),
    eventId = firstParam(params.eventId),
    page = parsePage(params.pagina)
  const [{ data: participants, metadata }, options] = await Promise.all([
    api.participants({ q, eventId, page }),
    api.auditOptions(),
  ])
  return (
    <>
      <PageHeader
        title="Participantes"
        description="Apelidos, eventos e progresso dos passaportes."
      />
      <Panel>
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            name="q"
            defaultValue={q}
            className={inputClass('sm')}
            placeholder="Buscar apelido"
            aria-label="Apelido"
          />
          <SelectField
            name="eventId"
            label="Evento"
            size="sm"
            defaultValue={eventId}
            options={[
              { value: '', label: 'Todos os eventos' },
              ...options.events.map((event) => ({ value: String(event.id), label: event.name })),
            ]}
          />
          <button className={buttonClass('ghost', { size: 'sm' })}>Filtrar</button>
        </form>
      </Panel>
      {participants.length === 0 ? (
        <EmptyState title="Nenhum participante encontrado" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {participants.map((participant) => (
            <Card key={participant.id}>
              <Link
                href={`/admin/participantes/${participant.id}`}
                className="flex h-full flex-col gap-3 p-4"
              >
                <div>
                  <h2 className="font-display text-lg font-extrabold">@{participant.nickname}</h2>
                  <p className="text-[13px] text-muted">
                    {pluralize(participant.events.length, 'evento', 'eventos')} ·{' '}
                    {pluralize(participant.totalCheckins, 'check-in', 'check-ins')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {participant.events.map((event) => (
                    <span
                      key={event.id}
                      className="rounded-full bg-surface-2 px-3 py-1 text-[12px]"
                    >
                      {event.name}: {event.visited}/{event.total}
                    </span>
                  ))}
                </div>
                <p className="mt-auto text-[12px] text-muted">
                  Última atividade:{' '}
                  {participant.lastActivity ? formatDateTime(participant.lastActivity) : 'nenhuma'}
                </p>
              </Link>
            </Card>
          ))}
        </ul>
      )}
      <Pagination
        metadata={metadata}
        label="Páginas de participantes"
        hrefFor={(target) =>
          hrefWith('/admin/participantes', { pagina: target > 1 ? target : undefined, q, eventId })
        }
      />
    </>
  )
}
