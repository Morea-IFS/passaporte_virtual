import Link from 'next/link'
import { buttonClass } from '@/components/ui/button'
import { ArrowLeftIcon } from '@/components/ui/icons'
import type { Page } from '@/lib/types'

/** Itens por página, igual ao PER_PAGE da API */
export const PER_PAGE = 20

type PaginationProps = {
  metadata: Page<unknown>['metadata']
  label: string
} & (
  | {
      /** Monta o link de uma página mantendo os demais filtros */
      hrefFor: (page: number) => string
      onPageChange?: never
    }
  | {
      /** Troca de página sem navegar (lista já carregada, ex.: SelectField) */
      onPageChange: (page: number) => void
      hrefFor?: never
    }
)

const stepClass = buttonClass('ghost', { size: 'sm' })

/** Botão de anterior/próxima: link, botão ou desabilitado */
function Step({
  page,
  enabled,
  rel,
  hrefFor,
  onPageChange,
  children,
}: {
  page: number
  enabled: boolean
  rel: 'prev' | 'next'
  hrefFor?: (page: number) => string
  onPageChange?: (page: number) => void
  children: React.ReactNode
}) {
  if (!enabled) {
    return (
      <span className={`${stepClass} pointer-events-none opacity-40`} aria-disabled="true">
        {children}
      </span>
    )
  }
  if (hrefFor) {
    return (
      <Link href={hrefFor(page)} className={stepClass} rel={rel}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={() => onPageChange?.(page)} className={stepClass}>
      {children}
    </button>
  )
}

/**
 * Navegação entre páginas (20 itens por página). Some quando há uma página só.
 */
export function Pagination({ metadata, label, hrefFor, onPageChange }: PaginationProps) {
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
        <Step
          page={currentPage - 1}
          enabled={currentPage > 1}
          rel="prev"
          hrefFor={hrefFor}
          onPageChange={onPageChange}
        >
          <ArrowLeftIcon className="size-4" />
          Anterior
        </Step>
        <Step
          page={currentPage + 1}
          enabled={currentPage < lastPage}
          rel="next"
          hrefFor={hrefFor}
          onPageChange={onPageChange}
        >
          Próxima
          <ArrowLeftIcon className="size-4 rotate-180" />
        </Step>
      </div>
    </nav>
  )
}
