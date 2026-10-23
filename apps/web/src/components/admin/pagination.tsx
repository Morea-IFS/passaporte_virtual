import Link from 'next/link'
import { buttonClass } from '@/components/ui/button'
import { ArrowLeftIcon } from '@/components/ui/icons'
import type { Page } from '@/lib/types'

type PaginationProps = {
  metadata: Page<unknown>['metadata']
  /** Monta o link de uma página mantendo os demais filtros */
  hrefFor: (page: number) => string
  label: string
}

/**
 * Navegação entre páginas (20 itens por página). Some quando há uma página só.
 */
export function Pagination({ metadata, hrefFor, label }: PaginationProps) {
  const { currentPage, lastPage, total, perPage } = metadata
  if (lastPage <= 1) return null

  const from = (currentPage - 1) * perPage + 1
  const to = Math.min(currentPage * perPage, total)

  return (
    <nav aria-label={label} className="flex flex-col items-center gap-3">
      <p className="text-[14px] text-muted">
        <span className="font-mono">
          {from}–{to}
        </span>{' '}
        de {total} · página {currentPage} de {lastPage}
      </p>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link
            href={hrefFor(currentPage - 1)}
            className={buttonClass('ghost', { size: 'sm' })}
            rel="prev"
          >
            <ArrowLeftIcon className="size-4" />
            Anterior
          </Link>
        ) : (
          <span
            className={`${buttonClass('ghost', { size: 'sm' })} pointer-events-none opacity-40`}
            aria-disabled="true"
          >
            <ArrowLeftIcon className="size-4" />
            Anterior
          </span>
        )}
        {currentPage < lastPage ? (
          <Link
            href={hrefFor(currentPage + 1)}
            className={buttonClass('ghost', { size: 'sm' })}
            rel="next"
          >
            Próxima
            <ArrowLeftIcon className="size-4 rotate-180" />
          </Link>
        ) : (
          <span
            className={`${buttonClass('ghost', { size: 'sm' })} pointer-events-none opacity-40`}
            aria-disabled="true"
          >
            Próxima
            <ArrowLeftIcon className="size-4 rotate-180" />
          </span>
        )}
      </div>
    </nav>
  )
}
