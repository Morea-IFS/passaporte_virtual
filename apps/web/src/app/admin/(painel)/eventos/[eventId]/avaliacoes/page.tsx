import { redirect } from 'next/navigation'
import { parseId } from '@/lib/params'
import { hrefWith } from '@/lib/url'

export default async function EvaluationResults({
  params,
}: PageProps<'/admin/eventos/[eventId]/avaliacoes'>) {
  const id = parseId((await params).eventId)
  redirect(hrefWith('/admin/dashboard', { evento: id, visao: 'avaliacoes' }))
}
