import { EmptyState } from '@/components/ui/feedback'
import type { RankingEntry } from '@/lib/analytics-types'

/** Lista compacta, acessível em telas estreitas, sem identificadores privados. */
export function RankingList({ entries }: { entries: RankingEntry[] }) {
  if (!entries.length) {
    return (
      <EmptyState title="Ainda não há participantes">
        Os apelidos aparecerão quando os primeiros passaportes forem criados.
      </EmptyState>
    )
  }
  return (
    <ol
      aria-label="Classificação por pontos visitados"
      className="flex flex-col divide-y divide-line rounded-m border border-line bg-surface px-4"
    >
      {entries.map((entry) => (
        <li key={entry.nickname} className="flex min-h-16 items-center gap-3 py-3">
          <span className="w-9 shrink-0 font-mono text-lg font-bold text-accent">
            <span aria-hidden="true">{entry.position}º</span>
            <span className="sr-only">{entry.position}º lugar</span>
          </span>
          <span className="min-w-0 flex-1 font-bold break-words">{entry.nickname}</span>
          <span className="shrink-0 text-right text-sm text-muted">
            <strong className="font-mono text-fg">{entry.visited}</strong> / {entry.total}
            <span className="block text-xs">pontos</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
