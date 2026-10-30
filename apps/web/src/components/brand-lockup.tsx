const DELAS = [
  { letter: 'D', className: 'bg-amarelo text-violeta-noite' },
  { letter: 'E', className: 'bg-verde text-creme' },
  { letter: 'L', className: 'bg-magenta text-creme' },
  { letter: 'A', className: 'bg-laranja text-creme' },
  { letter: 'S', className: 'bg-azul text-creme' },
]

type BrandLockupProps = {
  size?: 'sm' | 'lg'
}

/** Marca 23ª SNCT – Ciência Delas, recriada em tipografia (sem imagem). */
export function BrandLockup({ size = 'lg' }: BrandLockupProps) {
  const lg = size === 'lg'

  return (
    <div className="flex flex-col gap-2 font-display text-accent">
      <div className="flex items-end gap-2">
        <span className={`leading-none font-extrabold ${lg ? 'text-xl' : 'text-base'}`}>
          23<sup className="text-[0.55em]">a</sup>
        </span>
        <span
          className={`leading-[0.86] font-black tracking-tight ${lg ? 'text-4xl' : 'text-3xl'}`}
        >
          SNCT
        </span>
      </div>
      <span className={`leading-[0.9] font-black ${lg ? 'text-6xl' : 'text-4xl'}`}>CIÊNCIA</span>
      <div className="flex" role="img" aria-label="Delas">
        {DELAS.map(({ letter, className }) => (
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
