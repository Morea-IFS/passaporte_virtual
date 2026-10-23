const DELAS = [
  { letter: 'D', className: 'bg-amarelo text-violeta-noite' },
  { letter: 'E', className: 'bg-verde text-creme' },
  { letter: 'L', className: 'bg-magenta text-creme' },
  { letter: 'A', className: 'bg-laranja text-creme' },
  { letter: 'S', className: 'bg-azul text-creme' },
]

/**
 * Marca compacta para barras de navegação: "SNCT" + DELAS nos quadradinhos coloridos.
 */
export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-1.5 font-display text-base font-black text-accent">
      SNCT
      <span className="flex" aria-label="Delas">
        {DELAS.map(({ letter, className }) => (
          <span
            key={letter}
            aria-hidden="true"
            className={`grid h-5 w-4 place-items-center text-[11px] leading-none font-black ${className}`}
          >
            {letter}
          </span>
        ))}
      </span>
    </span>
  )
}
