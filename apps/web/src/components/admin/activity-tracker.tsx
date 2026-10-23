'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackActivity } from '@/app/admin/actions'

/**
 * Registra na auditoria cada tela aberta no painel (com filtros e página).
 * Fica no layout; precisa de <Suspense> por causa do useSearchParams.
 */
export function ActivityTracker() {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const last = useRef<string | null>(null)

  useEffect(() => {
    const path = search ? `${pathname}?${search}` : pathname
    // Evita registro duplo (StrictMode monta o efeito duas vezes em dev)
    if (last.current === path) return
    last.current = path
    trackActivity('view', path).catch(() => {})
  }, [pathname, search])

  return null
}

/** Link de arquivo estático (ex.: modelo de planilha) que registra o download */
export function TrackedDownload({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      download
      onClick={() => trackActivity('download', href).catch(() => {})}
      className="inline-flex min-h-11 items-center font-display text-[14px] font-bold text-accent underline underline-offset-4"
    >
      {children}
    </a>
  )
}
