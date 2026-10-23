import type { ComponentProps } from 'react'

type SwitchProps = Omit<ComponentProps<'input'>, 'type' | 'role' | 'className'> & {
  label: React.ReactNode
  description?: React.ReactNode
  /** "card": caixa com título e descrição (formulário); "inline": compacto (listas) */
  layout?: 'card' | 'inline'
}

/**
 * Interruptor liga/desliga. É um checkbox de verdade (role="switch"), então
 * funciona dentro de <form> (name/defaultChecked) ou controlado (checked/onChange).
 */
export function Switch({ label, description, layout = 'card', ...input }: SwitchProps) {
  const track = (
    <>
      <input type="checkbox" role="switch" className="peer sr-only" {...input} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-verde peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amarelo peer-disabled:opacity-60 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-creme after:transition-transform peer-checked:after:translate-x-5"
      />
    </>
  )

  if (layout === 'inline') {
    return (
      <label className="flex min-h-11 items-center gap-2.5 font-display text-[13px] font-bold text-muted">
        {track}
        {label}
      </label>
    )
  }

  return (
    <label className="flex min-h-11 items-center justify-between gap-4 rounded-m border border-line bg-surface p-4">
      <span className="flex flex-col">
        <span className="font-display font-bold">{label}</span>
        {description ? <span className="text-[13px] text-muted">{description}</span> : null}
      </span>
      {track}
    </label>
  )
}
