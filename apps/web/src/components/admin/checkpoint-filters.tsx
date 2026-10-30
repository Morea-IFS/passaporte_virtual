import Link from 'next/link'
import { buttonClass } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { InlineField } from '@/components/ui/field'
import { FilterChip } from '@/components/ui/filter-chip'
import { colorStyles } from '@/lib/categories'
import type { CheckpointCategory } from '@/lib/types'

export type CheckpointFilterValues = { categoria?: string; status?: string; q?: string }

const STATUS_OPTIONS = [
  [undefined, 'Todos'],
  ['ativos', 'Ativos'],
  ['desativados', 'Desativados'],
] as const

/**
 * Busca, filtro por categoria e por situação da lista de pontos.
 * Tudo por link/GET: funciona sem JavaScript e mantém a URL compartilhável.
 */
export function CheckpointFilters({
  eventId,
  categories,
  filters,
  hrefFor,
}: {
  eventId: number
  categories: CheckpointCategory[]
  filters: CheckpointFilterValues
  /** Link da lista com os filtros alterados (volta para a página 1) */
  hrefFor: (change: CheckpointFilterValues) => string
}) {
  return (
    <Panel className="p-3">
      <form method="get" role="search">
        {filters.categoria ? (
          <input type="hidden" name="categoria" value={filters.categoria} />
        ) : null}
        {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
        <InlineField
          id="busca"
          label="Buscar por nome ou código"
          labelHidden
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Buscar por nome ou código"
        >
          <button type="submit" className={buttonClass('ghost', { size: 'sm' })}>
            Buscar
          </button>
        </InlineField>
      </form>

      <nav aria-label="Filtrar por categoria" className="-mx-3 scrollbar-none overflow-x-auto px-3">
        <ul className="flex gap-2">
          <li>
            <FilterChip href={hrefFor({ categoria: undefined })} active={!filters.categoria}>
              Todas
            </FilterChip>
          </li>
          {categories.map((category) => {
            const id = String(category.id)
            const active = filters.categoria === id
            return (
              <li key={category.id}>
                <FilterChip
                  href={hrefFor({ categoria: active ? undefined : id })}
                  active={active}
                  activeClassName={colorStyles(category.color).chip}
                >
                  {category.name}
                </FilterChip>
              </li>
            )
          })}
          <li>
            <FilterChip href={`/admin/eventos/${eventId}/categorias`} dashed>
              Gerenciar
            </FilterChip>
          </li>
        </ul>
      </nav>

      <nav aria-label="Filtrar por situação" className="flex gap-4 text-[14px]">
        {STATUS_OPTIONS.map(([value, label]) => (
          <Link
            key={label}
            href={hrefFor({ status: value })}
            aria-current={filters.status === value ? 'page' : undefined}
            className={`min-h-11 min-w-11 content-center font-display font-bold ${filters.status === value ? 'text-accent underline decoration-2 underline-offset-4' : 'text-muted'}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </Panel>
  )
}
