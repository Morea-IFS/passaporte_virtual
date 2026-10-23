import { notFound } from 'next/navigation'
import { deleteCheckpoint } from '@/app/admin/actions'
import { CheckpointForm } from '@/components/admin/checkpoint-form'
import { CheckpointQrPanel } from '@/components/admin/checkpoint-qr-panel'
import { DangerZone } from '@/components/admin/danger-zone'
import { Notice } from '@/components/ui/feedback'
import { PageHeader } from '@/components/admin/page-header'
import { api } from '@/lib/api'
import { parseId } from '@/lib/params'

export default async function EditCheckpointPage({
  params,
}: PageProps<'/admin/eventos/[eventId]/pontos/[checkpointId]'>) {
  const ids = await params
  const eventId = parseId(ids.eventId)
  const [event, checkpoint, categories] = await Promise.all([
    api.event(eventId),
    api.checkpoint(parseId(ids.checkpointId)),
    api.categories(eventId),
  ])
  if (checkpoint.eventId !== event.id) notFound()

  return (
    <>
      <PageHeader
        title={checkpoint.name}
        back={{ href: `/admin/eventos/${event.id}`, label: event.name }}
        description={<span className="font-mono text-[13px]">{checkpoint.code}</span>}
      />

      {checkpoint.isActive ? null : (
        <Notice tone="neutral">Este ponto está desativado: não aceita novos carimbos.</Notice>
      )}

      <CheckpointForm eventId={event.id} categories={categories} checkpoint={checkpoint} />

      <CheckpointQrPanel checkpoint={checkpoint} />

      <DangerZone
        title="Excluir ponto"
        description="Exclui o ponto. Se for só uma pausa, prefira desativar."
        question="Excluir ponto?"
        confirmDescription={`"${checkpoint.name}" será excluído.`}
        onConfirm={deleteCheckpoint.bind(null, event.id, checkpoint.id)}
      />
    </>
  )
}
