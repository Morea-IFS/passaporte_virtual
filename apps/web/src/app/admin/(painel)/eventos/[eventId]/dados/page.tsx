import { redirect } from 'next/navigation'
import { parseId, parsePage } from '@/lib/params'
import { hrefWith } from '@/lib/url'

export default async function EventDataPage({
  params,
  searchParams,
}: PageProps<'/admin/eventos/[eventId]/dados'>) {
  const eventId = parseId((await params).eventId)
  const page = parsePage((await searchParams).pagina)
  redirect(
    hrefWith('/admin/dashboard', {
      evento: eventId,
      pagina: page > 1 ? page : undefined,
    })
  )
}
