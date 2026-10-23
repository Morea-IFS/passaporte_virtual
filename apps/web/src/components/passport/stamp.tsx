import { CATEGORY_COLORS, type CategoryColor } from '@/lib/categories'
import { formatStampDate } from '@/lib/format'

/** Hex das cores de categoria, para o SVG (o mesmo da identidade) */
const STAMP_HEX: Record<CategoryColor, string> = {
  azul: '#2563c9',
  laranja: '#f28322',
  magenta: '#d9327e',
  verde: '#2e9e4f',
  turquesa: '#169c93',
  amarelo: '#d9a400',
}

/** Circunferência do anel de texto (raio 35) */
const RING_LENGTH = 2 * Math.PI * 35 - 1

/** Inclinação estável por código, entre -12° e 12° (parece carimbo de verdade) */
function tilt(code: string) {
  const sum = [...code].reduce((total, char) => total + char.charCodeAt(0), 0)
  return (sum % 25) - 12
}

type StampProps = {
  code: string
  categoryName: string
  color: string
  /** ISO do carimbo */
  date: string
  label: string
  className?: string
  /** Animação de "bater o carimbo" (tela do check-in) */
  animate?: boolean
}

/**
 * Carimbo do passaporte: anel na cor da categoria com o nome em volta,
 * data e hora no centro, levemente torto.
 */
export function Stamp({
  code,
  categoryName,
  color,
  date,
  label,
  className = '',
  animate,
}: StampProps) {
  const hex = color in CATEGORY_COLORS ? STAMP_HEX[color as CategoryColor] : STAMP_HEX.azul
  const { day, time } = formatStampDate(date)
  const arcId = `stamp-arc-${code}`
  // Texto repetido para dar uma volta inteira, sem emenda (textLength = circunferência)
  const unit = `${categoryName.toUpperCase()} · ${code} · `
  const ring = unit.repeat(Math.max(1, Math.round(44 / unit.length)))

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      className={`${className} ${animate ? 'motion-safe:animate-[stamp-in_0.6s_cubic-bezier(.2,1.6,.4,1)_both]' : ''}`}
      style={{ color: hex, rotate: `${tilt(code)}deg` }}
    >
      <defs>
        <path id={arcId} d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0" />
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text
        fill="currentColor"
        className="font-display"
        fontWeight="800"
        fontSize="8.5"
        letterSpacing="1.2"
      >
        <textPath href={`#${arcId}`} textLength={RING_LENGTH} lengthAdjust="spacingAndGlyphs">
          {ring}
        </textPath>
      </text>
      <text
        x="50"
        y="48"
        textAnchor="middle"
        fill="currentColor"
        className="font-mono"
        fontWeight="700"
        fontSize="10"
      >
        {day}
      </text>
      <text
        x="50"
        y="61"
        textAnchor="middle"
        fill="currentColor"
        className="font-mono"
        fontSize="8.5"
      >
        {time}
      </text>
    </svg>
  )
}

/** Espaço vazio tracejado de um carimbo que ainda falta */
export function StampSlot({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span
      className={`grid aspect-square place-items-center rounded-full border-2 border-dashed border-line p-2 text-center font-mono text-[10px] leading-tight text-muted ${className}`}
    >
      {label}
    </span>
  )
}
