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

/** Gráfico temporal compacto; cada coluna mantém rótulo e valor em texto acessível. */
export function MetricColumns({
  items,
  labelEvery = 1,
  minimumColumnWidth,
}: {
  items: { key: string | number; label: string; value: number }[]
  labelEvery?: number
  minimumColumnWidth?: number
}) {
  const max = Math.max(1, ...items.map((item) => item.value))
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Ainda não há visitas registradas.</p>
  }

  return (
    <div className="flex flex-col">
      <div className="scrollbar-none overflow-x-auto pb-1">
        <ul
          className="flex h-44 min-w-full items-end gap-1"
          style={
            minimumColumnWidth ? { minWidth: `${items.length * minimumColumnWidth}px` } : undefined
          }
          aria-label="Distribuição de visitas"
        >
          {items.map((item, index) => (
            <li
              key={item.key}
              title={`${item.label}: ${item.value.toLocaleString('pt-BR')}`}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <span
                className={`w-full max-w-12 ${item.value ? 'rounded-t-s bg-accent' : 'h-px bg-line'}`}
                style={
                  item.value ? { height: `${Math.max(4, (item.value / max) * 132)}px` } : undefined
                }
                aria-hidden="true"
              />
              <span
                className="h-4 text-[9px] leading-4 whitespace-nowrap text-muted"
                aria-hidden="true"
              >
                {index % labelEvery === 0 ? item.label : ''}
              </span>
              <span className="sr-only">
                {item.label}: {item.value.toLocaleString('pt-BR')} visitas
              </span>
            </li>
          ))}
        </ul>
      </div>
      <details className="border-t border-line text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-accent">
          Ver valores
        </summary>
        <ul className="grid max-h-40 grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto pb-2 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.key} className="flex justify-between gap-2 border-b border-line py-1">
              <span>{item.label}</span>
              <strong className="font-mono">{item.value.toLocaleString('pt-BR')}</strong>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
