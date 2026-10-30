import { loadImage } from './image'

export const STORY_CARD_SIZE = { width: 1080, height: 1920 } as const

export type StoryCardDetails = {
  checkpointName: string
  eventName: string
  hashtag: string | null
  categoryName: string
  color: string
}

const BRAND_COLORS = [
  'violeta',
  'violeta-noite',
  'creme',
  'amarelo',
  'verde',
  'magenta',
  'laranja',
  'azul',
  'turquesa',
] as const

export function eventHashtag(hashtag: string | null) {
  const value = hashtag?.trim().replace(/^#+/, '')
  return value ? `#${value}` : ''
}

/** Não compartilha a URL do QR, o apelido nem os segredos do passaporte. */
export function storyShareText(details: StoryCardDetails) {
  return `Visitei ${details.checkpointName} no ${details.eventName}! ${eventHashtag(details.hashtag)}`.trim()
}

export function storyFileName(checkpointName: string) {
  const name = checkpointName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return `passaporte-${name || 'conquista'}.png`
}

/** O arquivo precisa estar pronto antes do gesto de compartilhamento. */
export async function shareStoryCard(
  file: File,
  details: StoryCardDetails,
  target: Partial<Pick<Navigator, 'share' | 'canShare'>> = navigator
): Promise<'shared' | 'unsupported' | 'cancelled' | 'failed'> {
  try {
    const files = [file]
    if (!target.share || !target.canShare?.({ files })) return 'unsupported'
    await target.share({ files, title: details.checkpointName, text: storyShareText(details) })
    return 'shared'
  } catch (cause) {
    return cause instanceof DOMException && cause.name === 'AbortError' ? 'cancelled' : 'failed'
  }
}

function wrapText(context: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.trim().split(/\s+/u)) {
    const candidate = line ? `${line} ${word}` : word
    if (context.measureText(candidate).width <= width) {
      line = candidate
      continue
    }
    if (line) lines.push(line)
    line = ''
    // Hashtags e palavras longas também precisam caber dentro do card.
    for (const character of word) {
      if (line && context.measureText(line + character).width > width) {
        lines.push(line)
        line = ''
      }
      line += character
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  {
    x,
    y,
    width,
    size,
    minSize,
    maxLines,
    family,
    weight = 900,
  }: {
    x: number
    y: number
    width: number
    size: number
    minSize: number
    maxLines: number
    family: string
    weight?: number
  }
) {
  let lines: string[]
  do {
    context.font = `${weight} ${size}px ${family}`
    lines = wrapText(context, text, width)
    if (lines.length <= maxLines || size <= minSize) break
    size -= 2
  } while (true)

  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
    let last = lines[maxLines - 1]
    while (last && context.measureText(`${last}…`).width > width) last = last.slice(0, -1)
    lines[maxLines - 1] = `${last}…`
  }
  for (const [index, line] of lines.entries()) {
    context.fillText(line, x, y + index * size * 1.2)
  }
}

/**
 * Exportação local: lê apenas tokens da marca e, opcionalmente, um blob da
 * foto escolhida. Nunca envia a foto ou o card ao servidor.
 */
export async function createStoryCard(details: StoryCardDetails, photoUrl: string | null = null) {
  const [photo] = await Promise.all([
    photoUrl ? loadImage(photoUrl) : Promise.resolve(null),
    document.fonts.ready,
  ])
  const style = getComputedStyle(document.documentElement)
  const palette = Object.fromEntries(
    BRAND_COLORS.map((name) => [name, style.getPropertyValue(`--color-${name}`).trim()])
  ) as Record<(typeof BRAND_COLORS)[number], string>
  const display = style.getPropertyValue('--font-montserrat').trim() || 'sans-serif'
  const sans = style.getPropertyValue('--font-nunito-sans').trim() || 'sans-serif'
  const categoryColor = palette[details.color as keyof typeof palette] || palette.azul

  const canvas = document.createElement('canvas')
  canvas.width = STORY_CARD_SIZE.width
  canvas.height = STORY_CARD_SIZE.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Este navegador não conseguiu criar o card. Tente outro navegador.')

  context.textBaseline = 'top'
  context.fillStyle = palette['violeta-noite']
  context.fillRect(0, 0, canvas.width, canvas.height)

  // Mosaico da identidade visual, também presente na interface do evento.
  const tiles = ['amarelo', 'verde', 'magenta', 'laranja', 'azul', 'turquesa'] as const
  for (let index = 0; index < 12; index++) {
    context.fillStyle = palette[tiles[index % tiles.length]]
    context.fillRect((index % 6) * 180, Math.floor(index / 6) * 32, 180, 32)
  }

  context.fillStyle = palette.amarelo
  drawText(context, 'PASSAPORTE VIRTUAL', {
    x: 84,
    y: 124,
    width: 912,
    size: 30,
    minSize: 30,
    maxLines: 1,
    family: display,
  })
  context.fillStyle = palette.creme
  drawText(context, details.eventName, {
    x: 84,
    y: 184,
    width: 912,
    size: 58,
    minSize: 34,
    maxLines: 3,
    family: display,
  })

  context.save()
  context.beginPath()
  context.roundRect(84, 430, 912, 730, 40)
  context.clip()
  context.fillStyle = palette.creme
  context.fillRect(84, 430, 912, 730)

  if (photo) {
    const scale = Math.max(912 / photo.naturalWidth, 730 / photo.naturalHeight)
    const width = photo.naturalWidth * scale
    const height = photo.naturalHeight * scale
    context.imageSmoothingQuality = 'high'
    context.drawImage(photo, 84 + (912 - width) / 2, 430 + (730 - height) / 2, width, height)
  } else {
    for (let index = 0; index < 6; index++) {
      context.fillStyle = palette[tiles[index]]
      const x = 84 + (index % 3) * 304
      const y = 430 + Math.floor(index / 3) * 365
      context.beginPath()
      context.arc(x + 152, y + 182, 170, 0, Math.PI * 2)
      context.fill()
    }
    context.fillStyle = palette['violeta-noite']
    context.fillRect(140, 638, 800, 314)
    context.fillStyle = palette.creme
    drawText(context, 'EU ESTIVE AQUI!', {
      x: 194,
      y: 691,
      width: 692,
      size: 96,
      minSize: 80,
      maxLines: 2,
      family: display,
    })
  }
  context.restore()

  context.fillStyle = palette.creme
  context.beginPath()
  context.roundRect(84, 1204, 912, 72, 20)
  context.fill()
  context.fillStyle = categoryColor
  context.fillRect(112, 1226, 24, 28)
  context.fillStyle = palette['violeta-noite']
  drawText(context, details.categoryName.toLocaleUpperCase('pt-BR'), {
    x: 160,
    y: 1225,
    width: 808,
    size: 30,
    minSize: 22,
    maxLines: 1,
    family: display,
  })

  context.fillStyle = palette.creme
  drawText(context, details.checkpointName, {
    x: 84,
    y: 1320,
    width: 912,
    size: 76,
    minSize: 38,
    maxLines: 4,
    family: display,
  })
  context.fillStyle = palette.amarelo
  drawText(context, eventHashtag(details.hashtag) || 'Cada visita, uma descoberta.', {
    x: 84,
    y: 1714,
    width: 912,
    size: 48,
    minSize: 28,
    maxLines: 2,
    family: display,
  })
  context.fillStyle = palette.creme
  drawText(context, 'UMA CONQUISTA NO MEU PASSAPORTE', {
    x: 84,
    y: 1838,
    width: 912,
    size: 25,
    minSize: 25,
    maxLines: 1,
    family: sans,
    weight: 700,
  })

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Não foi possível gerar a imagem. Tente novamente.')
  return new File([blob], storyFileName(details.checkpointName), { type: 'image/png' })
}
