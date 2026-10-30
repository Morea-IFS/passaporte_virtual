'use client'

import { useState, type RefObject } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { buttonClass } from '@/components/ui/button'
import { Actions } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'

type ImageCropDialogProps = {
  dialogRef: RefObject<HTMLDialogElement | null>
  /** Imagem escolhida (object URL); null quando fechado */
  src: string | null
  /** Largura / altura do recorte */
  aspect: number
  /** Texto de apoio, ex.: tamanho final */
  description: string
  onConfirm: (area: Area) => void
  onCancel: () => void
}

/**
 * Enquadramento de imagem: arraste para posicionar e use o zoom.
 * A área fica na proporção do formato (capa 16:9, logomarca quadrada).
 */
export function ImageCropDialog({
  dialogRef,
  src,
  aspect,
  description,
  onConfirm,
  onCancel,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)

  return (
    <Modal dialogRef={dialogRef} title="Ajustar enquadramento" onClose={onCancel}>
      <p className="text-[15px] text-muted">{description}</p>
      <div className="relative h-64 overflow-hidden rounded-m bg-violeta-noite sm:h-80">
        {src ? (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            minZoom={1}
            maxZoom={4}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        ) : null}
      </div>
      <label className="flex items-center gap-3 font-display text-[13px] font-bold">
        Zoom
        <input
          type="range"
          min={1}
          max={4}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="min-h-11 w-full accent-violeta"
        />
      </label>
      <Actions align="end">
        <button type="button" onClick={onCancel} className={buttonClass('ghost')}>
          Cancelar
        </button>
        <button
          type="button"
          disabled={!area}
          onClick={() => area && onConfirm(area)}
          className={buttonClass('primary')}
        >
          Usar imagem
        </button>
      </Actions>
    </Modal>
  )
}
