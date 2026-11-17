import type { PassportProgress } from '@/lib/types'

const SEGMENT_COLORS = ['bg-amarelo', 'bg-verde', 'bg-magenta', 'bg-laranja', 'bg-azul']

/**
 * Progresso do passaporte (RF16): número grande e uma barra em segmentos
 * coloridos (as cores de MOREA).
 */
export function ProgressBar({
  progress,
  caption,
}: {
  progress: PassportProgress
  caption?: string
}) {
  const { visited, total } = progress
  const segments = Math.max(total, 1)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <strong className="font-display text-[26px] font-black text-accent tabular-nums">
          {visited}/{total}
        </strong>
        <span className="text-[14px] text-muted">{caption ?? 'carimbos'}</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={visited}
        aria-label={`${visited} de ${total} pontos visitados`}
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: segments }, (_, index) => (
          <span
            key={index}
            className={`h-3 rounded-[2px] ${index < visited ? SEGMENT_COLORS[index % SEGMENT_COLORS.length] : 'bg-surface-2'}`}
          />
        ))}
      </div>
    </div>
  )
}
