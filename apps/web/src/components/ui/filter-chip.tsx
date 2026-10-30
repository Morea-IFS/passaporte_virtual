import Link from 'next/link'

type FilterChipProps = {
  href: string
  active?: boolean
  /** Classes de cor quando ativo (padrão: violeta) */
  activeClassName?: string
  /** Chip de ação (ex.: "Gerenciar"): borda tracejada */
  dashed?: boolean
  children: React.ReactNode
}

/**
 * Chip clicável de filtro (link). Ativo fica preenchido; inativo, só contorno.
 */
export function FilterChip({
  href,
  active,
  activeClassName = 'bg-violeta text-creme',
  dashed,
  children,
}: FilterChipProps) {
  const state = active
    ? activeClassName
    : dashed
      ? 'border-[1.5px] border-dashed border-line text-accent'
      : 'border-[1.5px] border-line text-muted'
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 font-display text-[11px] font-bold tracking-wider whitespace-nowrap uppercase ${state}`}
    >
      {children}
    </Link>
  )
}
