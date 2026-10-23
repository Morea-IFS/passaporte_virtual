import { EventForm } from '@/components/admin/event-form'
import { PageHeader } from '@/components/admin/page-header'

export default function NewEventPage() {
  return (
    <>
      <PageHeader title="Novo evento" back={{ href: '/admin', label: 'Eventos' }} />
      <EventForm cancelHref="/admin" />
    </>
  )
}
