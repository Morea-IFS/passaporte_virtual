import { PageHeader } from '@/components/admin/page-header'
import { Pagination } from '@/components/ui/pagination'
import { buttonClass } from '@/components/ui/button'
import { Card, Panel } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/feedback'
import { SelectField } from '@/components/ui/select-field'
import { api } from '@/lib/api'
import { formatDateTime, pluralize } from '@/lib/format'
import { parseId, parsePage } from '@/lib/params'
import { firstParam, hrefWith } from '@/lib/url'

export default async function ParticipantDetailPage({
  params,
  searchParams,
}: PageProps<'/admin/participantes/[id]'>) {
  const id = parseId((await params).id)
  const query = await searchParams
  const eventId = firstParam(query.eventId)
  const page = parsePage(query.pagina)
  const [participant, { data: checkins, metadata }] = await Promise.all([
    api.participant(id),
    api.participantCheckins(id, { eventId, page }),
  ])
  const base = `/admin/participantes/${id}`
  return (
    <>
      <PageHeader
        title={`@${participant.nickname}`}
        back={{ href: '/admin/participantes', label: 'Participantes' }}
        description={`${pluralize(participant.totalCheckins, 'check-in', 'check-ins')} no total`}
      />
      {participant.events.length === 0 ? (
        <EmptyState title="Este participante ainda não visitou nenhum ponto" />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {participant.events.map((event) => (
              <Card key={event.id} interactive={false}>
                <div className="flex items-center justify-between gap-3 p-4">
                  <h2 className="font-display font-extrabold">{event.name}</h2>
                  <strong className="font-display text-xl font-black text-accent tabular-nums">
                    {event.visited}/{event.total}
                  </strong>
                </div>
              </Card>
            ))}
          </ul>

          <section className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-extrabold">Pontos visitados</h2>
            {participant.events.length > 1 ? (
              <Panel>
                <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <SelectField
                    name="eventId"
                    label="Evento"
                    size="sm"
                    defaultValue={eventId}
                    options={[
                      { value: '', label: 'Todos os eventos' },
                      ...participant.events.map((event) => ({
                        value: String(event.id),
                        label: event.name,
                      })),
                    ]}
                  />
                  <button className={buttonClass('ghost', { size: 'sm' })}>Filtrar</button>
                </form>
              </Panel>
            ) : null}
            {checkins.length === 0 ? (
              <EmptyState title="Nenhum ponto visitado neste evento" />
            ) : (
              <Card as="section" interactive={false}>
                <ul className="divide-y divide-line">
                  {checkins.map((checkin) => (
                    <li
                      key={checkin.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[12px] text-muted">{checkin.code}</span>
                        <p className="font-semibold">{checkin.name}</p>
                        {participant.events.length > 1 ? (
                          <p className="text-[12px] text-muted">{checkin.eventName}</p>
                        ) : null}
                      </div>
                      <time
                        className="shrink-0 font-mono text-[12px] text-muted"
                        dateTime={checkin.visitedAt}
                      >
                        {formatDateTime(checkin.visitedAt)}
                      </time>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Pagination
              metadata={metadata}
              label="Páginas de pontos visitados"
              hrefFor={(target) =>
                hrefWith(base, { pagina: target > 1 ? target : undefined, eventId })
              }
            />
          </section>
        </>
      )}
    </>
  )
}
