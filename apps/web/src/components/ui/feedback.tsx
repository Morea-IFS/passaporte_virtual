const noticeTones = {
  error: 'border-2 border-magenta text-magenta font-semibold',
  success: 'border-2 border-verde text-verde font-semibold',
  neutral: 'border-2 border-line text-muted',
} as const

/**
 * Aviso em caixa: erro de formulário, sucesso de importação, ponto
 * desativado etc. Erro anuncia para leitores de tela imediatamente.
 */
export function Notice({
  tone,
  children,
}: {
  tone: keyof typeof noticeTones
  children: React.ReactNode
}) {
  if (!children) return null
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-m bg-surface px-4 py-3 text-[15px] ${noticeTones[tone]}`}
    >
      {children}
    </p>
  )
}

/** Mensagem de erro em linha (sem caixa), ex.: dentro de modais */
export function InlineError({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="text-[15px] font-semibold text-magenta">
      {children}
    </p>
  )
}

/**
 * Lista vazia: título e uma orientação do que fazer.
 */
export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-m border-2 border-dashed border-line p-6">
      <p className="font-display text-lg font-extrabold">{title}</p>
      {children ? <div className="text-muted">{children}</div> : null}
    </div>
  )
}
