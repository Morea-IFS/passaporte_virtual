import Link from 'next/link'
import { CheckpointRowActions } from '@/components/admin/checkpoint-row-actions'
import { CheckpointThumb } from '@/components/admin/checkpoint-thumb'
import { Card } from '@/components/ui/card'
import { CategoryChip } from '@/components/ui/category-chip'
import type { Checkpoint } from '@/lib/types'

/**
 * Ponto na lista do evento: miniatura, código, nome e categoria (link para
 * editar) e a faixa de ações rápidas.
 */
export function CheckpointCard({ checkpoint }: { checkpoint: Checkpoint }) {
  return (
    <Card>
      <Link
        href={`/admin/eventos/${checkpoint.eventId}/pontos/${checkpoint.id}`}
        className={`flex items-center gap-3 p-3 ${checkpoint.isActive ? '' : 'opacity-70'}`}
      >
        <CheckpointThumb checkpoint={checkpoint} size={56} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-mono text-[11px] tracking-wide text-muted">
            {checkpoint.code}
            {checkpoint.location ? ` · ${checkpoint.location}` : ''}
          </span>
          <span className="truncate font-display leading-tight font-extrabold">
            {checkpoint.name}
          </span>
          <span className="flex flex-wrap gap-1.5">
            <CategoryChip category={checkpoint.category} />
          </span>
        </span>
      </Link>
      <CheckpointRowActions checkpoint={checkpoint} />
    </Card>
  )
}
