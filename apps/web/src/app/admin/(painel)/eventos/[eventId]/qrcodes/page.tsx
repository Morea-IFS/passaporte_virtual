import { PageHeader } from '@/components/admin/page-header'
import { buttonClass } from '@/components/ui/button'
import { Actions, Panel } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/feedback'
import { DownloadIcon } from '@/components/ui/icons'
import { OptionCard } from '@/components/ui/option-card'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { pluralize } from '@/lib/format'
import { parseId } from '@/lib/params'

/** Miniaturas dos formatos de impressão */
function PosterSketch() {
  return (
    <span className="flex h-16 w-12 flex-col items-center gap-1 rounded-s border-2 border-line bg-bg p-1.5">
      <span className="h-2 w-full rounded-xs bg-magenta" />
      <span className="mt-1 size-6 rounded-xs bg-fg/80" />
    </span>
  )
}

function LabelsSketch() {
  return (
    <span className="grid h-16 w-12 grid-cols-2 grid-rows-3 gap-1 rounded-s border-2 border-line bg-bg p-1.5">
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} className="rounded-xs bg-fg/80" />
      ))}
    </span>
  )
}

export default async function QrCodesPage({
  params,
}: PageProps<'/admin/eventos/[eventId]/qrcodes'>) {
  const eventId = parseId((await params).eventId)
  const event = await api.event(eventId)
  const inactive = event.checkpointsCount - event.activeCheckpointsCount

  return (
    <>
      <PageHeader
        title="QR codes"
        back={{ href: `/admin/eventos/${event.id}`, label: event.name }}
        description="Baixe os QR codes de todos os pontos para imprimir e colocar nos estandes e salas."
      />

      {event.checkpointsCount === 0 ? (
        <EmptyState title="Nenhum ponto cadastrado">
          Cadastre os pontos do evento para gerar os QR codes.
        </EmptyState>
      ) : (
        <form
          method="get"
          action={`/admin/eventos/${event.id}/qrcodes/pdf`}
          className="flex flex-col gap-5"
        >
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 font-display text-[13px] font-bold">Formato</legend>
            <OptionCard
              name="layout"
              value="cartaz"
              defaultChecked
              title="Cartaz A4"
              description="Um ponto por folha, com QR grande. Para fixar no estande ou na porta da sala."
              illustration={<PosterSketch />}
            />
            <OptionCard
              name="layout"
              value="etiquetas"
              title="Etiquetas"
              description="Seis por folha A4, com linha tracejada para recortar."
              illustration={<LabelsSketch />}
            />
          </fieldset>

          {inactive > 0 ? (
            <Switch
              name="includeInactive"
              label="Incluir pontos desativados"
              description={`${pluralize(inactive, 'ponto desativado fica', 'pontos desativados ficam')} de fora se esta opção estiver desligada.`}
            />
          ) : null}

          <Panel className="text-[14px] text-muted">
            O PDF terá {pluralize(event.activeCheckpointsCount, 'ponto ativo', 'pontos ativos')}
            {inactive > 0 ? ' (mais os desativados, se incluir)' : ''}. Imprima em tamanho real
            (100%), sem ajustar à página.
          </Panel>

          <Actions>
            <button type="submit" className={buttonClass('primary')}>
              <DownloadIcon className="size-5" />
              Baixar PDF
            </button>
          </Actions>
        </form>
      )}
    </>
  )
}
