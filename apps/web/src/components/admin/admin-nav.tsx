'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Eventos', match: ['/admin', '/admin/eventos'] },
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/participantes', label: 'Participantes' },
  { href: '/admin/administradores', label: 'Administradores' },
  { href: '/admin/auditoria', label: 'Auditoria' },
]

function isActive(pathname: string, link: (typeof LINKS)[number]) {
  return (link.match ?? [link.href]).some((base) =>
    base === '/admin' ? pathname === base : pathname === base || pathname.startsWith(`${base}/`)
  )
}

/** Abas do painel; a seção atual fica destacada com o traço da marca. */
export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Área administrativa" className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LINKS.map((link) => {
          const active = isActive(pathname, link)
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center border-b-3 px-3 font-display text-[13px] font-bold whitespace-nowrap ${active ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-accent'}`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
