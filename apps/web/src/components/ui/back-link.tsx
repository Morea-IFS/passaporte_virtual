import Link from 'next/link'
import { ArrowLeftIcon } from '@/components/ui/icons'

/** Link de voltar (seta + rótulo em caixa alta), no topo das telas */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 self-start font-display text-xs font-bold tracking-[0.14em] text-muted uppercase hover:text-accent"
    >
      <ArrowLeftIcon className="size-4 shrink-0" />
      {label}
    </Link>
  )
}
