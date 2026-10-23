import { buttonClass } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { CopyButton } from '@/components/ui/copy-button'
import { DownloadIcon } from '@/components/ui/icons'
import { QrCode } from '@/components/ui/qr-code'
import { hrefWith } from '@/lib/url'
import type { Checkpoint } from '@/lib/types'

/**
 * QR code do ponto na página de edição: prévia, link e PDFs para imprimir.
 */
export function CheckpointQrPanel({ checkpoint }: { checkpoint: Checkpoint }) {
  const pdfHref = (layout: 'cartaz' | 'etiquetas') =>
    hrefWith(`/admin/eventos/${checkpoint.eventId}/qrcodes/pdf`, {
      layout,
      ids: checkpoint.id,
      includeInactive: 'on',
    })

  return (
    <Panel as="section">
      <h2 className="font-display text-lg font-extrabold">QR code</h2>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <QrCode value={checkpoint.checkinUrl} label={`QR code de ${checkpoint.name}`} />
        <div className="flex min-w-0 flex-col items-start gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[12px] break-all text-muted">
              {checkpoint.checkinUrl}
            </span>
            <span className="-ml-2">
              <CopyButton value={checkpoint.checkinUrl} />
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={pdfHref('cartaz')} download className={buttonClass('ghost', { size: 'sm' })}>
              <DownloadIcon className="size-4" />
              Cartaz A4
            </a>
            <a
              href={pdfHref('etiquetas')}
              download
              className={buttonClass('ghost', { size: 'sm' })}
            >
              <DownloadIcon className="size-4" />
              Etiqueta
            </a>
          </div>
        </div>
      </div>
    </Panel>
  )
}
