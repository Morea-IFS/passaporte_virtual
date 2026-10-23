import type { ComponentProps } from 'react'

type OptionCardProps = Omit<ComponentProps<'input'>, 'type' | 'className'> & {
  title: string
  description: string
  /** Ilustração pequena à esquerda */
  illustration?: React.ReactNode
}

/**
 * Opção de rádio em formato de cartão (escolhas com descrição, ex.: formato
 * de impressão). Marcado ganha borda e fundo na cor de destaque.
 */
export function OptionCard({ title, description, illustration, ...input }: OptionCardProps) {
  return (
    <label className="flex cursor-pointer">
      <input type="radio" className="peer sr-only" {...input} />
      <span className="flex w-full items-center gap-4 rounded-m border-2 border-line bg-surface p-4 transition-colors peer-checked:border-accent peer-checked:bg-surface-2 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amarelo">
        {illustration ? <span className="shrink-0">{illustration}</span> : null}
        <span className="flex flex-col gap-0.5">
          <span className="font-display font-extrabold">{title}</span>
          <span className="text-[14px] text-muted">{description}</span>
        </span>
      </span>
    </label>
  )
}
