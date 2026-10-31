const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-display font-extrabold transition-[transform,box-shadow] disabled:cursor-not-allowed disabled:opacity-60'

const sizes = {
  md: 'min-h-12 px-5 text-[15px]',
  sm: 'min-h-11 px-4 text-[14px]',
} as const

/*
 * Botões preenchidos: a "base" escura do botão é uma sombra interna (inset).
 * Sombra externa deixava um fio claro nas curvas, porque ela não é pintada
 * por baixo do botão e a borda suavizada mistura com o fundo da página.
 */
const variants = {
  primary:
    'bg-violeta pb-1 text-creme shadow-[inset_0_-4px_0_var(--color-violeta-noite)] active:translate-y-0.5 active:shadow-[inset_0_-2px_0_var(--color-violeta-noite)]',
  sun: 'bg-amarelo pb-1 text-violeta-noite shadow-[inset_0_-4px_0_#c39500] active:translate-y-0.5 active:shadow-[inset_0_-2px_0_#c39500]',
  ghost: 'border-2 border-current bg-transparent text-accent',
  danger: 'border-2 border-current bg-transparent text-danger',
  dangerSolid: 'bg-danger text-surface',
} as const

export type ButtonVariant = keyof typeof variants

type ButtonOptions = {
  size?: keyof typeof sizes
  /** Largura total sempre */
  block?: boolean
  /** Largura total no celular, tamanho do conteúdo a partir de sm */
  blockOnMobile?: boolean
}

/**
 * Classes de botão da identidade. Serve para <button> e <Link>.
 */
export function buttonClass(variant: ButtonVariant = 'primary', options: ButtonOptions = {}) {
  const width = options.block
    ? 'w-full'
    : options.blockOnMobile
      ? 'w-full sm:w-auto sm:self-start'
      : ''
  return `${base} ${sizes[options.size ?? 'md']} ${variants[variant]} ${width}`
}

/**
 * Botão discreto de texto (e ícone), para ações secundárias em barras e
 * rodapés de card: "Sair", "Excluir", "Cancelar" etc.
 */
export function quietButtonClass(tone: 'muted' | 'danger' = 'muted') {
  const hover = tone === 'danger' ? 'hover:text-danger' : 'hover:text-accent'
  return `inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2 font-display text-[13px] font-bold text-muted ${hover} disabled:opacity-60`
}

/** Botão só com ícone (alvo de toque de 44px) */
export function iconButtonClass(tone: 'muted' | 'danger' = 'muted') {
  const hover = tone === 'danger' ? 'hover:text-danger' : 'hover:text-accent'
  return `grid size-11 place-items-center rounded-full text-muted ${hover}`
}
