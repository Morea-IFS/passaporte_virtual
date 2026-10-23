import { ChevronDownIcon } from '@/components/ui/icons'

/**
 * Seção que abre e fecha (<details> nativo: funciona sem JavaScript).
 * Para conteúdo secundário que não deve quebrar o fluxo da página.
 */
export function Disclosure({
  title,
  icon,
  summary,
  defaultOpen,
  children,
}: {
  title: string
  icon?: React.ReactNode
  /** Texto curto ao lado do título, visível fechado */
  summary?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={defaultOpen} className="group rounded-m border border-line bg-surface open:pb-4">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
        {icon ? <span className="text-accent">{icon}</span> : null}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-display font-extrabold">{title}</span>
          {summary ? <span className="truncate text-[13px] text-muted">{summary}</span> : null}
        </span>
        <ChevronDownIcon className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-4 px-4 pt-1">{children}</div>
    </details>
  )
}
