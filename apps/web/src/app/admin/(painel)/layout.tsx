import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { logout } from '@/app/admin/actions'
import { ActivityTracker } from '@/components/admin/activity-tracker'
import { AdminNav } from '@/components/admin/admin-nav'
import { BrandMark } from '@/components/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { quietButtonClass } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Organização · Passaporte Virtual',
}

export default function PainelLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex min-h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/admin" className="flex min-h-11 items-center gap-2">
            <BrandMark />
            <span className="font-display text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
              Organização
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className={quietButtonClass()}>
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <AdminNav />
      <Suspense fallback={null}>
        <ActivityTracker />
      </Suspense>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-6 pb-16">
        {children}
      </main>
    </div>
  )
}
