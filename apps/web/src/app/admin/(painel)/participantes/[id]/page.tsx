import { PageHeader } from '@/components/admin/page-header'
import { Card, Panel } from '@/components/ui/card'
import { api } from '@/lib/api'
import { formatDateTime, pluralize } from '@/lib/format'
import { parseId } from '@/lib/params'

export default async function ParticipantDetailPage({
  params,
}: PageProps<'/admin/participantes/[id]'>) {
  const participant = await api.participant(parseId((await params).id))
  return (
    <>
      <PageHeader
        title={`@${participant.nickname}`}
        back={{ href: '/admin/participantes', label: 'Participantes' }}
        description={`${pluralize(participant.totalCheckins, 'check-in', 'check-ins')} no total`}
      />
      {participant.events.length === 0 ? (
        <Panel>
          <p className="text-muted">Este participante ainda não visitou nenhum ponto.</p>
        </Panel>
      ) : (
        <div className="grid gap-5">
          {participant.events.map((event) => (
            <Card key={event.id} as="section" interactive={false}>
              <div className="border-b border-line p-4">
                <h2 className="font-display text-lg font-extrabold">{event.name}</h2>
                <p className="text-[13px] text-muted">
                  Progresso: {event.visited} de {event.total}
                </p>
              </div>
              <ul className="divide-y divide-line">
                {event.checkpoints?.map((checkpoint) => (
                  <li
                    key={checkpoint.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <span className="font-mono text-[12px] text-muted">{checkpoint.code}</span>
                      <p className="font-semibold">{checkpoint.name}</p>
                    </div>
                    <time className="text-[12px] text-muted" dateTime={checkpoint.visitedAt}>
                      {formatDateTime(checkpoint.visitedAt)}
                    </time>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
