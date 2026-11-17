const MOREA = [
  { letter: 'M', className: 'bg-amarelo text-violeta-noite' },
  { letter: 'O', className: 'bg-verde text-creme' },
  { letter: 'R', className: 'bg-magenta text-creme' },
  { letter: 'E', className: 'bg-laranja text-creme' },
  { letter: 'A', className: 'bg-azul text-creme' },
]

type BrandLockupProps = {
  size?: 'sm' | 'lg'
}

/** Marca Passaporte MOREA, recriada em tipografia (sem imagem). */
export function BrandLockup({ size = 'lg' }: BrandLockupProps) {
  const lg = size === 'lg'

  return (
    <div className="flex flex-col gap-2 font-display text-accent">
      <span className={`leading-[0.86] font-black tracking-tight ${lg ? 'text-5xl' : 'text-3xl'}`}>
        PASSAPORTE
      </span>
      <div className="flex" role="img" aria-label="MOREA">
        {MOREA.map(({ letter, className }) => (
          <span
            key={letter}
            aria-hidden="true"
            className={`grid h-[1.15em] w-[1.05em] place-items-center leading-none font-black ${className} ${lg ? 'text-5xl' : 'text-[34px]'}`}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  )
}
