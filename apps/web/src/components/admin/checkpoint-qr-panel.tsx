import { buttonClass } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import { CopyButton } from '@/components/ui/copy-button'
import { DownloadIcon, QrIcon } from '@/components/ui/icons'
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
    <Disclosure
      title="QR code"
      icon={<QrIcon className="size-5" />}
      summary="Ver, copiar o link e baixar para imprimir"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <QrCode value={checkpoint.checkinUrl} label={`QR code de ${checkpoint.name}`} />
        <span className="font-mono text-[12px] break-all text-muted">{checkpoint.checkinUrl}</span>
        <CopyButton value={checkpoint.checkinUrl} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={pdfHref('cartaz')}
          download
          className={buttonClass('ghost', { size: 'sm', block: true })}
        >
          <DownloadIcon className="size-4" />
          Cartaz A4
        </a>
        <a
          href={pdfHref('etiquetas')}
          download
          className={buttonClass('ghost', { size: 'sm', block: true })}
        >
          <DownloadIcon className="size-4" />
          Etiqueta
        </a>
      </div>
    </Disclosure>
  )
}
