/**
 * Formatos de imagem dos pontos. Imagens em outra proporção são enquadradas
 * no navegador antes do envio e saem neste tamanho.
 */
export const IMAGE_SPECS = {
  image: {
    width: 1200,
    height: 675,
    label: '1200 × 675 px (16:9)',
    type: 'image/jpeg',
    extension: 'jpg',
  },
  logo: {
    width: 512,
    height: 512,
    label: '512 × 512 px (quadrada)',
    // PNG mantém a transparência da logomarca
    type: 'image/png',
    extension: 'png',
  },
} as const

export type ImageSpec = (typeof IMAGE_SPECS)[keyof typeof IMAGE_SPECS]

export type CropArea = { x: number; y: number; width: number; height: number }

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    image.src = src
  })
}

/** A imagem já tem a proporção do formato (tolerância de 1%)? */
export function matchesAspect(width: number, height: number, spec: ImageSpec) {
  return Math.abs(width / height - spec.width / spec.height) / (spec.width / spec.height) < 0.01
}

/**
 * Recorta a área escolhida e redimensiona para o tamanho do formato
 * (sem aumentar imagens menores que isso). Devolve um File pronto para o form.
 */
export async function cropToFile(src: string, area: CropArea, spec: ImageSpec, baseName: string) {
  const image = await loadImage(src)
  const scale = Math.min(1, spec.width / area.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width * scale)
  canvas.height = Math.round(area.height * scale)

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Não foi possível processar a imagem.')
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, spec.type, 0.9))
  if (!blob) throw new Error('Não foi possível processar a imagem.')

  const name = `${baseName.replace(/\.[^.]+$/, '')}.${spec.extension}`
  return new File([blob], name, { type: spec.type })
}
