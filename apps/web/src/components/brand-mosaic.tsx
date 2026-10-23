/**
 * Mosaico da identidade Ciência Delas: blocos nas cores da marca com
 * quartos e meios círculos, e a rede de pontos (constelação) por cima.
 * Padrão determinístico (mesmo resultado no servidor e no navegador).
 * Não tem altura própria: quem usa define (h-*, flex-1...); blocos que
 * passarem da área ficam cortados.
 */

const COLORS = [
  'bg-amarelo',
  'bg-verde',
  'bg-magenta',
  'bg-laranja',
  'bg-azul',
  'bg-turquesa',
  'bg-violeta',
]

const SHAPES = [
  'rounded-br-full top-0 left-0',
  'rounded-bl-full top-0 right-0',
  'rounded-tl-full bottom-0 right-0',
  'rounded-tr-full bottom-0 left-0',
  'rounded-t-full bottom-0 left-0 h-1/2!',
  'rounded-full inset-[22%] size-[56%]!',
  '',
]

const TILE_COUNT = 72

/** Gerador pseudoaleatório com semente fixa (padrão estável) */
function seeded(seed: number) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

const TILES = (() => {
  const random = seeded(23)
  return Array.from({ length: TILE_COUNT }, () => {
    const bg = COLORS[Math.floor(random() * COLORS.length)]
    let fg = COLORS[Math.floor(random() * COLORS.length)]
    if (fg === bg) fg = COLORS[(COLORS.indexOf(bg) + 3) % COLORS.length]
    return { bg, fg, shape: SHAPES[Math.floor(random() * SHAPES.length)] }
  })
})()

export function BrandMosaic({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative overflow-hidden bg-violeta-noite ${className}`}>
      <div className="absolute inset-x-0 top-0 grid grid-cols-6 sm:grid-cols-8">
        {TILES.map((tile, index) => (
          <span
            key={index}
            className={`relative aspect-square overflow-hidden ${tile.bg} motion-safe:animate-[tile-in_0.5s_ease-out_both]`}
            style={{ animationDelay: `${(index % 12) * 45 + Math.floor(index / 12) * 60}ms` }}
          >
            {tile.shape ? <span className={`absolute size-full ${tile.fg} ${tile.shape}`} /> : null}
          </span>
        ))}
      </div>
      <Constellation />
    </div>
  )
}

const STARS: [number, number, number][] = [
  [12, 18, 1.4],
  [30, 10, 2],
  [52, 22, 1.4],
  [78, 12, 2.4],
  [40, 42, 2.4],
  [70, 46, 1.4],
  [18, 58, 2],
  [44, 74, 1.4],
  [82, 72, 2],
  [62, 90, 1.6],
]
const LINKS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [1, 4],
  [2, 4],
  [4, 5],
  [3, 5],
  [4, 6],
  [6, 7],
  [7, 5],
  [5, 8],
  [7, 9],
  [8, 9],
]

function Constellation() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
    >
      <g stroke="#fffdf8" strokeWidth="0.35" strokeOpacity="0.85">
        {LINKS.map(([from, to]) => (
          <line
            key={`${from}-${to}`}
            x1={STARS[from][0]}
            y1={STARS[from][1]}
            x2={STARS[to][0]}
            y2={STARS[to][1]}
          />
        ))}
      </g>
      <g fill="#fffdf8">
        {STARS.map(([x, y, r], index) => (
          <circle key={index} cx={x} cy={y} r={r} />
        ))}
      </g>
    </svg>
  )
}
