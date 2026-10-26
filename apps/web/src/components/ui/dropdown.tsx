import { ChevronDownIcon } from '@/components/ui/icons'
import { buttonClass } from '@/components/ui/button'

/**
 * Botão que abre um painel flutuante (<details> nativo: funciona sem
 * JavaScript). O painel ocupa a largura do ancestral mais próximo com
 * `relative` (ex.: o formulário de busca).
 */
export function Dropdown({
  label,
  icon,
  count,
  blockOnMobile,
  children,
}: {
  label: string
  icon?: React.ReactNode
  /** Selo ao lado do rótulo (ex.: quantos filtros estão ativos) */
  count?: number
  /** Botão na largura toda no celular */
  blockOnMobile?: boolean
  children: React.ReactNode
}) {
  return (
    <details className="group shrink-0">
      <summary
        className={`${buttonClass('ghost', { size: 'sm', blockOnMobile })} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        {icon}
        {label}
        {count ? (
          <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1 font-mono text-[11px] text-on-accent">
            {count}
          </span>
        ) : null}
        <ChevronDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute inset-x-0 top-full z-20 mt-2 flex flex-col gap-3 rounded-m border border-line bg-surface p-4 shadow-[0_24px_60px_-20px_rgba(29,17,71,0.6)]">
        {children}
      </div>
    </details>
  )
}
