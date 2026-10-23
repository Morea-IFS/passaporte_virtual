'use client'

import { useState } from 'react'
import { quietButtonClass } from '@/components/ui/button'

/**
 * Copia um texto (ex.: link) e confirma por 2 segundos.
 */
export function CopyButton({ value, label = 'Copiar link' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      className={quietButtonClass()}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          // Sem permissão de área de transferência: o link continua visível para copiar à mão
        }
      }}
    >
      <span aria-live="polite">{copied ? 'Copiado!' : label}</span>
    </button>
  )
}
