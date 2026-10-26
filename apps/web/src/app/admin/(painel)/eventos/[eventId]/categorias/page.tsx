import { PageHeader } from '@/components/admin/page-header'
import { api } from '@/lib/api'
import { parseId, parsePage } from '@/lib/params'
import { Pagination } from '@/components/ui/pagination'
import { hrefWith } from '@/lib/url'
import { CategoryManager } from './category-manager'

export default async function CategoriesPage({
  params,
  searchParams,
}: PageProps<'/admin/eventos/[eventId]/categorias'>) {
  const eventId = parseId((await params).eventId)
  const page = parsePage((await searchParams).pagina)
  const [event, { data: categories, metadata }, allCategories] = await Promise.all([
    api.event(eventId),
    api.categoriesPage(eventId, page),
    api.categories(eventId),
  ])

  return (
    <>
      <PageHeader
        title="Categorias"
        back={{ href: `/admin/eventos/${event.id}`, label: event.name }}
        description="Tipos de ponto deste evento. A cor é escolhida automaticamente entre as cores da marca."
      />
      <CategoryManager eventId={event.id} categories={categories} allCategories={allCategories} />
      <Pagination
        metadata={metadata}
        label="Páginas de categorias"
        hrefFor={(target) =>
          hrefWith(`/admin/eventos/${event.id}/categorias`, {
            pagina: target > 1 ? target : undefined,
          })
        }
      />
    </>
  )
}
