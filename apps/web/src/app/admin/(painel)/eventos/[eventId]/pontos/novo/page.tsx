import { CheckpointForm } from '@/components/admin/checkpoint-form'
import { PageHeader } from '@/components/admin/page-header'
import { api } from '@/lib/api'
import { parseId } from '@/lib/params'

export default async function NewCheckpointPage({
  params,
}: PageProps<'/admin/eventos/[eventId]/pontos/novo'>) {
  const eventId = parseId((await params).eventId)
  const [event, categories] = await Promise.all([api.event(eventId), api.categories(eventId)])

  return (
    <>
      <PageHeader
        title="Novo ponto"
        back={{ href: `/admin/eventos/${event.id}`, label: event.name }}
        description="Estande, oficina, apresentação ou atividade que o visitante pode carimbar."
      />
      <CheckpointForm eventId={event.id} categories={categories} />
    </>
  )
}
