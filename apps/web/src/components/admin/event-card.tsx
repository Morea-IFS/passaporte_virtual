import Link from 'next/link'
import { removeEvent } from '@/app/admin/actions'
import { quietButtonClass } from '@/components/ui/button'
import { Card, CardFooter } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TrashIcon } from '@/components/ui/icons'
import { formatEventPeriod, pluralize } from '@/lib/format'
import type { PassportEvent } from '@/lib/types'

/**
 * Evento na lista: link, período, local e contagem de pontos, com
 * exclusão no rodapé.
 */
export function EventCard({ event }: { event: PassportEvent }) {
  return (
    <Card>
      <Link href={`/admin/eventos/${event.id}`} className="flex flex-1 flex-col gap-3 p-4">
        <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
          /{event.slug}
        </span>
        <span className="font-display text-lg leading-tight font-extrabold">{event.name}</span>
        <span className="text-[15px] text-muted">
          {formatEventPeriod(event.startsOn, event.endsOn)}
          {event.location ? ` · ${event.location}` : ''}
        </span>
        <span className="mt-auto flex flex-wrap gap-x-3 font-display text-[13px] font-bold text-accent">
          <span>{pluralize(event.checkpointsCount, 'ponto', 'pontos')}</span>
          {event.checkpointsCount > event.activeCheckpointsCount ? (
            <span className="text-muted">
              {pluralize(event.activeCheckpointsCount, 'ativo', 'ativos')}
            </span>
          ) : null}
        </span>
      </Link>
      <CardFooter align="end">
        <ConfirmDialog
          trigger={
            <>
              <TrashIcon className="size-4" />
              Excluir
            </>
          }
          triggerClassName={quietButtonClass('danger')}
          title="Excluir evento?"
          description={`"${event.name}" e ${pluralize(event.checkpointsCount, 'ponto', 'pontos')} serão excluídos.`}
          confirmLabel="Sim, excluir"
          pendingLabel="Excluindo..."
          onConfirm={removeEvent.bind(null, event.id)}
        />
      </CardFooter>
    </Card>
  )
}
