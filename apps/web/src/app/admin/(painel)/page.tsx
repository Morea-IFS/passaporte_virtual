import Link from 'next/link'
import { EventCard } from '@/components/admin/event-card'
import { PageHeader } from '@/components/admin/page-header'
import { Pagination } from '@/components/admin/pagination'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { api } from '@/lib/api'
import { parsePage } from '@/lib/params'
import { hrefWith } from '@/lib/url'

export default async function EventsPage({ searchParams }: PageProps<'/admin'>) {
  const page = parsePage((await searchParams).pagina)
  const { data: events, metadata } = await api.events(page)

  return (
    <>
      <PageHeader
        title="Eventos"
        description="Cada evento tem seus próprios pontos e passaportes."
        actions={
          <Link href="/admin/eventos/novo" className={buttonClass('primary')}>
            Novo evento
          </Link>
        }
      />

      {events.length === 0 ? (
        <EmptyState title="Nenhum evento ainda">
          Comece cadastrando o evento, depois adicione os estandes, oficinas e atividades.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ul>
      )}

      <Pagination
        metadata={metadata}
        label="Páginas de eventos"
        hrefFor={(target) => hrefWith('/admin', { pagina: target > 1 ? target : undefined })}
      />
    </>
  )
}
