import { deleteEvent } from '@/app/admin/actions'
import { DangerZone } from '@/components/admin/danger-zone'
import { EventForm } from '@/components/admin/event-form'
import { PageHeader } from '@/components/admin/page-header'
import { api } from '@/lib/api'
import { pluralize } from '@/lib/format'
import { parseId } from '@/lib/params'

export default async function EditEventPage({
  params,
}: PageProps<'/admin/eventos/[eventId]/editar'>) {
  const eventId = parseId((await params).eventId)
  const event = await api.event(eventId)

  return (
    <>
      <PageHeader
        title="Editar evento"
        back={{ href: `/admin/eventos/${event.id}`, label: event.name }}
      />
      <EventForm event={event} cancelHref={`/admin/eventos/${event.id}`} />

      <DangerZone
        title="Excluir evento"
        description={`Exclui o evento e ${pluralize(event.checkpointsCount, 'ponto cadastrado', 'pontos cadastrados')}.`}
        question="Excluir evento?"
        confirmDescription={`"${event.name}" e ${pluralize(event.checkpointsCount, 'ponto', 'pontos')} serão excluídos.`}
        onConfirm={deleteEvent.bind(null, event.id)}
      />
    </>
  )
}
