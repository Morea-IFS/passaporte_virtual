import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { formatEventPeriod, pluralize } from '@/lib/format'
import type { PublicEvent } from '@/lib/types'

/** Evento na home do visitante: toque abre o passaporte daquele evento */
export function EventChoiceCard({ event, visited }: { event: PublicEvent; visited?: number }) {
  return (
    <Card>
      <Link href={`/passaporte/${event.slug}`} className="flex flex-col gap-2 p-4">
        <span className="font-display text-lg leading-tight font-extrabold">{event.name}</span>
        <span className="text-[15px] text-muted">
          {formatEventPeriod(event.startsOn, event.endsOn)}
          {event.location ? ` · ${event.location}` : ''}
        </span>
        <span className="flex flex-wrap gap-x-3 font-display text-[13px] font-bold">
          {visited !== undefined ? (
            <span className="text-accent">
              {visited}/{event.checkpointsCount} no seu passaporte
            </span>
          ) : (
            <span className="text-accent">
              {pluralize(event.checkpointsCount, 'ponto', 'pontos')} para carimbar
            </span>
          )}
          {event.hashtag ? <span className="text-muted">{event.hashtag}</span> : null}
        </span>
      </Link>
    </Card>
  )
}
