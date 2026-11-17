const MOREA = [
  { letter: 'M', className: 'bg-amarelo text-violeta-noite' },
  { letter: 'O', className: 'bg-verde text-creme' },
  { letter: 'R', className: 'bg-magenta text-creme' },
  { letter: 'E', className: 'bg-laranja text-creme' },
  { letter: 'A', className: 'bg-azul text-creme' },
]

/**
 * Marca compacta para barras de navegação: "Passaporte" + MOREA nos quadradinhos coloridos.
 */
export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-1.5 font-display text-xs font-black text-accent">
      PASSAPORTE
      <span className="flex" role="img" aria-label="MOREA">
        {MOREA.map(({ letter, className }) => (
          <span
            key={letter}
            aria-hidden="true"
            className={`grid h-5 w-3.5 place-items-center text-[10px] leading-none font-black ${className}`}
          >
            {letter}
          </span>
        ))}
      </span>
    </span>
  )
}
