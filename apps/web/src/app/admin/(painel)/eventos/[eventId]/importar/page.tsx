import { PageHeader } from '@/components/admin/page-header'
import { TrackedDownload } from '@/components/admin/activity-tracker'
import { Panel } from '@/components/ui/card'
import { api } from '@/lib/api'
import { parseId } from '@/lib/params'
import { ImportForm } from './import-form'

export default async function ImportPage({
  params,
}: PageProps<'/admin/eventos/[eventId]/importar'>) {
  const eventId = parseId((await params).eventId)
  const [event, categories] = await Promise.all([api.event(eventId), api.categories(eventId)])

  return (
    <>
      <PageHeader
        title="Importar planilha"
        back={{ href: `/admin/eventos/${event.id}`, label: event.name }}
        description="Cadastre vários pontos de uma vez a partir de uma planilha."
      />

      <Panel as="section">
        <h2 className="font-display text-[15px] font-extrabold">Como montar o arquivo</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-muted">
          <li>
            Primeira linha com os nomes das colunas: <b className="text-fg">nome</b>,{' '}
            <b className="text-fg">categoria</b>, <b className="text-fg">resumo</b> e{' '}
            <b className="text-fg">local</b>. Só nome e categoria são obrigatórias.
          </li>
          <li>
            Categoria: o nome de uma categoria deste evento (
            {categories.map((category) => category.name).join(', ') || 'nenhuma cadastrada'}).
            Maiúsculas e acentos não importam.
          </li>
          <li>
            Aceita Excel (<b className="text-fg">.xlsx</b>, <b className="text-fg">.xls</b>),
            LibreOffice (<b className="text-fg">.ods</b>) e <b className="text-fg">CSV</b>. Só a
            primeira aba é lida. Do Google Planilhas, baixe como .xlsx.
          </li>
          <li>Imagens e logomarcas são adicionadas depois, editando cada ponto.</li>
        </ul>
        <div className="flex flex-wrap gap-x-5">
          <TrackedDownload href="/modelo-pontos.xlsx">Baixar modelo (.xlsx)</TrackedDownload>
          <TrackedDownload href="/modelo-pontos.csv">Baixar modelo (.csv)</TrackedDownload>
        </div>
      </Panel>

      <ImportForm eventId={event.id} />
    </>
  )
}
