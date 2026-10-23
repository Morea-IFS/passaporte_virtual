/**
 * Card de lista: borda, fundo de superfície e destaque ao passar o mouse.
 * Conteúdo clicável (link) vai dentro; ações ficam no CardFooter.
 */
export function Card({
  as: Tag = 'li',
  interactive = true,
  className = '',
  children,
}: {
  as?: 'li' | 'div' | 'section'
  /** Destaca a borda ao passar o mouse (cards clicáveis) */
  interactive?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tag
      className={`flex flex-col overflow-hidden rounded-m border border-line bg-surface ${interactive ? 'transition-colors hover:border-accent' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

/** Faixa de ações no rodapé do card, separada por uma linha */
export function CardFooter({
  align = 'between',
  children,
}: {
  align?: 'between' | 'end'
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex items-center gap-2 border-t border-line px-3 py-1 ${align === 'end' ? 'justify-end' : 'justify-between'}`}
    >
      {children}
    </div>
  )
}

/** Caixa de conteúdo sem destaque de hover (instruções, painéis de filtro) */
export function Panel({
  as: Tag = 'div',
  tone = 'default',
  className = '',
  children,
}: {
  as?: 'div' | 'section'
  /** "danger": borda magenta (lista de erros) */
  tone?: 'default' | 'danger'
  className?: string
  children: React.ReactNode
}) {
  const border = tone === 'danger' ? 'border-2 border-magenta' : 'border border-line'
  return (
    <Tag className={`flex flex-col gap-3 rounded-m bg-surface p-4 ${border} ${className}`}>
      {children}
    </Tag>
  )
}

/**
 * Fileira de botões no fim de formulários e modais: empilhados no celular
 * (ação principal embaixo, mais perto do polegar), lado a lado em telas maiores.
 */
export function Actions({
  align = 'start',
  children,
}: {
  align?: 'start' | 'end'
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex flex-col-reverse gap-3 sm:flex-row ${align === 'end' ? 'sm:justify-end' : ''}`}
    >
      {children}
    </div>
  )
}
