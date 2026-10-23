import Image from 'next/image'
import { colorStyles } from '@/lib/categories'
import type { Checkpoint } from '@/lib/types'

/**
 * Miniatura do ponto. Ordem: logomarca (inteira, fundo creme), imagem de
 * capa (cortada) ou, sem imagens, um bloco na cor da categoria com o quarto
 * de círculo do mosaico da identidade.
 */
export function CheckpointThumb({
  checkpoint,
  size = 64,
}: {
  checkpoint: Pick<Checkpoint, 'category' | 'imageUrl' | 'logoUrl'>
  size?: number
}) {
  const src = checkpoint.logoUrl ?? checkpoint.imageUrl
  const isLogo = Boolean(checkpoint.logoUrl)

  if (src) {
    return (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-s ${isLogo ? 'bg-creme p-1.5' : ''}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          unoptimized
          className={`size-full ${isLogo ? 'object-contain' : 'object-cover'}`}
        />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`relative shrink-0 overflow-hidden rounded-s ${colorStyles(checkpoint.category.color).fill}`}
      style={{ width: size, height: size }}
    >
      <span className="absolute right-0 bottom-0 size-3/5 rounded-tl-full bg-violeta" />
    </span>
  )
}
