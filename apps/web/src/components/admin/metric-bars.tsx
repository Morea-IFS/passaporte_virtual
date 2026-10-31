import { EmptyState } from '@/components/ui/feedback'

/** Cada barra tem seu valor em texto; a cor nunca é a única fonte de informação. */
export function MetricBars({
  items,
  emptyLabel = 'Ainda não há visitas registradas.',
}: {
  items: { key: string | number; label: string; value: number }[]
  emptyLabel?: string
}) {
  const max = Math.max(1, ...items.map((item) => item.value))
  if (items.length === 0) return <EmptyState title={emptyLabel} />
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 break-words">{item.label}</span>
            <strong className="shrink-0 font-mono">{item.value.toLocaleString('pt-BR')}</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
