import type Checkpoint from '#models/checkpoint'
import type Event from '#models/event'
import app from '@adonisjs/core/services/app'
import drive from '@adonisjs/drive/services/main'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

export type QrLayout = 'cartaz' | 'etiquetas'

/** Cores da marca (docs/identidade-visual) */
const BRAND = {
  violeta: '#3b2492',
  noite: '#1d1147',
  creme: '#f7f2e9',
  papel: '#fffdf8',
  linha: '#e2d9c6',
  muted: '#5f5480',
  amarelo: '#f6c21c',
  verde: '#2e9e4f',
  magenta: '#d9327e',
  laranja: '#f28322',
  azul: '#2563c9',
  turquesa: '#169c93',
} as const

const CATEGORY_HEX: Record<string, string> = {
  azul: BRAND.azul,
  laranja: BRAND.laranja,
  magenta: BRAND.magenta,
  verde: BRAND.verde,
  turquesa: BRAND.turquesa,
  amarelo: BRAND.amarelo,
}

/** Cores claras pedem texto escuro no chip */
const DARK_TEXT_ON = new Set(['laranja', 'amarelo'])

const FONTS = {
  display: 'Montserrat-Black',
  displayBold: 'Montserrat-ExtraBold',
  body: 'NunitoSans-Regular',
  bodyBold: 'NunitoSans-Bold',
} as const

type Doc = PDFKit.PDFDocument

/**
 * PDF de QR codes para imprimir (RF08/RF09).
 * - cartaz: um ponto por página A4, para o estande;
 * - etiquetas: 6 por página A4 (2 × 3), com contorno tracejado para recortar.
 */
export async function buildQrCodesPdf(event: Event, checkpoints: Checkpoint[], layout: QrLayout) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    autoFirstPage: false,
    info: { Title: `QR codes · ${event.name}`, Author: 'Passaporte Virtual' },
  })
  for (const font of Object.values(FONTS)) {
    doc.registerFont(font, app.makePath('resources/fonts', `${font}.ttf`))
  }

  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  const logos = await loadLogos(checkpoints)

  if (layout === 'cartaz') {
    for (const checkpoint of checkpoints) {
      doc.addPage()
      drawPoster(doc, event, checkpoint, logos.get(checkpoint.id))
    }
  } else {
    drawLabels(doc, event, checkpoints, logos)
  }

  doc.end()
  return done
}

/* ---------- Cartaz (1 por página) ---------- */

function drawPoster(doc: Doc, event: Event, checkpoint: Checkpoint, logo?: Buffer) {
  const { width, height } = doc.page
  doc.rect(0, 0, width, height).fill(BRAND.creme)
  drawMosaic(doc, 0, 0, width, 150, 8)

  // Cartão branco sobre o mosaico
  const card = { x: 44, y: 104, w: width - 88, h: height - 148 }
  doc.roundedRect(card.x, card.y, card.w, card.h, 22).fillAndStroke(BRAND.papel, BRAND.linha)

  const inner = { x: card.x + 36, w: card.w - 72 }
  let y = card.y + 34

  if (logo) {
    drawImageSafe(doc, logo, card.x + card.w - 36 - 64, y - 6, 64, 64)
  }

  doc
    .font(FONTS.displayBold)
    .fontSize(10)
    .fillColor(BRAND.muted)
    .text(event.name.toUpperCase(), inner.x, y, {
      width: inner.w - (logo ? 76 : 0),
      characterSpacing: 1.4,
      lineBreak: false,
      ellipsis: true,
    })
  y += 26

  y = drawCategoryChip(doc, checkpoint, inner.x, y, 12) + 16

  doc.font(FONTS.display).fontSize(30).fillColor(BRAND.violeta)
  const nameOptions = { width: inner.w, height: 118, ellipsis: true, lineGap: -2 }
  doc.text(checkpoint.name, inner.x, y, nameOptions)
  y += Math.min(doc.heightOfString(checkpoint.name, nameOptions), 118) + 8

  if (checkpoint.location) {
    doc.font(FONTS.body).fontSize(14).fillColor(BRAND.muted)
    doc.text(checkpoint.location, inner.x, y, { width: inner.w, lineBreak: false, ellipsis: true })
    y += 24
  }

  // QR centralizado no espaço que sobra acima do rodapé
  const footerTop = card.y + card.h - 120
  const qrSize = Math.min(300, footerTop - y - 24)
  const qrX = (width - qrSize) / 2
  const qrY = y + (footerTop - y - qrSize) / 2
  drawQr(doc, checkpoint.checkinUrl, qrX, qrY, qrSize)

  doc
    .font(FONTS.displayBold)
    .fontSize(16)
    .fillColor(BRAND.noite)
    .text('Aponte a câmera do celular', inner.x, footerTop, { width: inner.w, align: 'center' })
  doc
    .font(FONTS.body)
    .fontSize(13)
    .fillColor(BRAND.muted)
    .text('e carimbe seu passaporte virtual', inner.x, footerTop + 22, {
      width: inner.w,
      align: 'center',
    })

  const baseY = card.y + card.h - 40
  doc
    .moveTo(inner.x, baseY - 14)
    .lineTo(inner.x + inner.w, baseY - 14)
    .lineWidth(1)
    .stroke(BRAND.linha)
  doc.font(FONTS.bodyBold).fontSize(11).fillColor(BRAND.muted)
  doc.text(checkpoint.code, inner.x, baseY, { characterSpacing: 1 })
  if (event.hashtag) {
    doc.font(FONTS.displayBold).fontSize(12).fillColor(BRAND.violeta)
    doc.text(event.hashtag, inner.x, baseY - 1, { width: inner.w, align: 'right' })
  }
}

/* ---------- Etiquetas (6 por página) ---------- */

function drawLabels(doc: Doc, event: Event, checkpoints: Checkpoint[], logos: Map<number, Buffer>) {
  const columns = 2
  const rows = 3
  const margin = 28
  const gap = 12
  const pageWidth = 595.28
  const pageHeight = 841.89
  const w = (pageWidth - margin * 2 - gap * (columns - 1)) / columns
  const h = (pageHeight - margin * 2 - gap * (rows - 1)) / rows

  checkpoints.forEach((checkpoint, index) => {
    const slot = index % (columns * rows)
    if (slot === 0) {
      doc.addPage()
      doc.rect(0, 0, pageWidth, pageHeight).fill('#ffffff')
    }
    const x = margin + (slot % columns) * (w + gap)
    const y = margin + Math.floor(slot / columns) * (h + gap)
    drawLabel(doc, event, checkpoint, logos.get(checkpoint.id), x, y, w, h)
  })
}

function drawLabel(
  doc: Doc,
  event: Event,
  checkpoint: Checkpoint,
  logo: Buffer | undefined,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const color = CATEGORY_HEX[checkpoint.category.color] ?? BRAND.azul

  // Contorno tracejado = guia de recorte
  doc.save()
  doc.roundedRect(x, y, w, h, 14).lineWidth(0.8).dash(4, { space: 3 }).stroke(BRAND.linha)
  doc.restore()

  // Faixa da categoria no topo
  doc.save()
  doc.roundedRect(x, y, w, h, 14).clip()
  doc.rect(x, y, w, 10).fill(color)
  doc.restore()

  const pad = 16
  let cursor = y + 20

  if (logo) drawImageSafe(doc, logo, x + w - pad - 26, cursor - 2, 26, 26)
  doc
    .font(FONTS.displayBold)
    .fontSize(7.5)
    .fillColor(BRAND.muted)
    .text(event.name.toUpperCase(), x + pad, cursor, {
      width: w - pad * 2 - (logo ? 32 : 0),
      characterSpacing: 1,
      lineBreak: false,
      ellipsis: true,
    })
  cursor += 14
  drawCategoryChip(doc, checkpoint, x + pad, cursor, 8)

  const qrSize = 116
  drawQr(doc, checkpoint.checkinUrl, x + (w - qrSize) / 2, y + 62, qrSize)

  cursor = y + 62 + qrSize + 8
  doc.font(FONTS.display).fontSize(12).fillColor(BRAND.violeta)
  doc.text(checkpoint.name, x + pad, cursor, {
    width: w - pad * 2,
    align: 'center',
    height: 30,
    ellipsis: true,
    lineGap: -1,
  })

  doc.font(FONTS.body).fontSize(8.5).fillColor(BRAND.muted)
  const meta = [checkpoint.code, checkpoint.location].filter(Boolean).join(' · ')
  doc.text(meta, x + pad, y + h - 22, {
    width: w - pad * 2,
    align: 'center',
    lineBreak: false,
    ellipsis: true,
  })
}

/* ---------- Peças ---------- */

/** Chip arredondado na cor da categoria; devolve o y abaixo dele */
function drawCategoryChip(doc: Doc, checkpoint: Checkpoint, x: number, y: number, size: number) {
  const { name, color } = checkpoint.category
  const label = name.toUpperCase()
  doc.font(FONTS.displayBold).fontSize(size)
  const textWidth = doc.widthOfString(label, { characterSpacing: size * 0.08 })
  const height = size * 2.1
  const padX = size * 0.95
  doc
    .roundedRect(x, y, textWidth + padX * 2, height, height / 2)
    .fill(CATEGORY_HEX[color] ?? BRAND.azul)
  doc
    .fillColor(DARK_TEXT_ON.has(color) ? BRAND.noite : BRAND.papel)
    .text(label, x + padX, y + (height - size) / 2 - size * 0.12, {
      lineBreak: false,
      characterSpacing: size * 0.08,
    })
  return y + height
}

/**
 * QR vetorial (nítido em qualquer tamanho), com margem branca de 4 módulos
 * para a câmera reconhecer.
 */
function drawQr(doc: Doc, text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const count = qr.modules.size
  const quiet = 4
  const cell = size / (count + quiet * 2)

  doc.roundedRect(x, y, size, size, cell * 2).fill('#ffffff')
  doc.fillColor(BRAND.noite)
  for (let row = 0; row < count; row++) {
    let col = 0
    while (col < count) {
      if (!qr.modules.get(row, col)) {
        col++
        continue
      }
      // Junta módulos escuros seguidos num retângulo só
      let end = col
      while (end + 1 < count && qr.modules.get(row, end + 1)) end++
      doc.rect(
        x + (quiet + col) * cell,
        y + (quiet + row) * cell,
        (end - col + 1) * cell + 0.15,
        cell + 0.15
      )
      col = end + 1
    }
  }
  doc.fill(BRAND.noite)
}

/**
 * Faixa do mosaico da identidade (blocos com quartos e meios círculos),
 * padrão fixo para todos os cartazes ficarem iguais.
 */
function drawMosaic(doc: Doc, x: number, y: number, w: number, h: number, columns: number) {
  const size = w / columns
  const rows = Math.ceil(h / size)
  const palette = [
    BRAND.amarelo,
    BRAND.verde,
    BRAND.magenta,
    BRAND.laranja,
    BRAND.azul,
    BRAND.turquesa,
    BRAND.violeta,
  ]
  let seed = 23
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  doc.save()
  doc.rect(x, y, w, h).clip()
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const tx = x + col * size
      const ty = y + row * size
      const bg = palette[Math.floor(random() * palette.length)]
      let fg = palette[Math.floor(random() * palette.length)]
      if (fg === bg) fg = palette[(palette.indexOf(bg) + 3) % palette.length]
      const shape = Math.floor(random() * 7)

      doc.rect(tx, ty, size, size).fill(bg)
      doc.fillColor(fg)
      const s = size
      switch (shape) {
        case 0: // quarto: centro no canto superior esquerdo
          doc.path(`M ${tx} ${ty} L ${tx + s} ${ty} A ${s} ${s} 0 0 1 ${tx} ${ty + s} Z`).fill()
          break
        case 1: // canto superior direito
          doc.path(`M ${tx + s} ${ty} L ${tx + s} ${ty + s} A ${s} ${s} 0 0 1 ${tx} ${ty} Z`).fill()
          break
        case 2: // canto inferior direito
          doc
            .path(`M ${tx + s} ${ty + s} L ${tx} ${ty + s} A ${s} ${s} 0 0 1 ${tx + s} ${ty} Z`)
            .fill()
          break
        case 3: // canto inferior esquerdo
          doc.path(`M ${tx} ${ty + s} L ${tx} ${ty} A ${s} ${s} 0 0 1 ${tx + s} ${ty + s} Z`).fill()
          break
        case 4: // meio círculo apoiado na base
          doc.path(`M ${tx} ${ty + s} A ${s / 2} ${s / 2} 0 0 1 ${tx + s} ${ty + s} Z`).fill()
          break
        case 5: // círculo central
          doc.circle(tx + s / 2, ty + s / 2, s * 0.28).fill()
          break
        default: // bloco liso
          break
      }
    }
  }
  doc.restore()
}

/** pdfkit aceita PNG e JPEG; outros formatos (ex.: WebP antigo) ficam de fora */
function drawImageSafe(doc: Doc, image: Buffer, x: number, y: number, w: number, h: number) {
  const isPng = image.subarray(0, 4).toString('hex') === '89504e47'
  const isJpeg = image.subarray(0, 2).toString('hex') === 'ffd8'
  if (!isPng && !isJpeg) return
  doc.image(image, x, y, { fit: [w, h], align: 'center', valign: 'center' })
}

async function loadLogos(checkpoints: Checkpoint[]) {
  const logos = new Map<number, Buffer>()
  const disk = drive.use()
  await Promise.all(
    checkpoints
      .filter((checkpoint) => checkpoint.logoPath)
      .map(async (checkpoint) => {
        try {
          logos.set(checkpoint.id, Buffer.from(await disk.getBytes(checkpoint.logoPath!)))
        } catch {
          // Arquivo ausente: segue sem logomarca
        }
      })
  )
  return logos
}
