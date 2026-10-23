import { BrandLockup } from '@/components/brand-lockup'

const CATEGORIAS = [
  { label: 'Pesquisa', className: 'bg-pesquisa text-creme' },
  { label: 'Oficina', className: 'bg-oficina text-violeta-noite' },
  { label: 'Apresentação', className: 'bg-apresentacao text-creme' },
  { label: 'Cultural', className: 'bg-cultural text-creme' },
  { label: 'Curso', className: 'bg-curso text-creme' },
]

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <BrandLockup />

      <p className="font-display text-sm font-semibold tracking-[0.16em] text-accent uppercase">
        Semana Nacional de
        <br />
        Ciência e Tecnologia
      </p>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">Seu passaporte do evento</h1>
        <p className="text-muted">
          Visite estandes, oficinas e apresentações. Cada QR code vira um carimbo.
        </p>
      </div>

      <ul className="flex flex-wrap gap-2">
        {CATEGORIAS.map(({ label, className }) => (
          <li
            key={label}
            className={`inline-flex min-h-[30px] items-center rounded-full px-3 font-display text-xs font-bold tracking-wider uppercase ${className}`}
          >
            {label}
          </li>
        ))}
      </ul>

      <p className="mt-auto font-display text-accent">
        <strong className="text-3xl font-black">3 e 4</strong>{' '}
        <span className="text-lg tracking-wide">DEZEMBRO</span>
        <span className="block text-sm font-bold">Aracaju Parque Shopping</span>
      </p>
    </main>
  )
}
